// Host half of dsh-liars-dice.
//
// Owns the table state and exposes it over one prefixed route:
//
//   GET  /dsh-liars-dice/state?table=...      public table + active hand + odds
//   GET  /dsh-liars-dice/replay?table=...     replay, with hidden dice redacted
//   POST /dsh-liars-dice/new                  start a match
//   POST /dsh-liars-dice/bid                  raise the current bid
//   POST /dsh-liars-dice/challenge            open the cup
//   POST /dsh-liars-dice/next                 deal the next round / finish
//   POST /dsh-liars-dice/agent                one agent opponent turn
//   POST /dsh-liars-dice/referee              agent referee commentary
//   POST /dsh-liars-dice/reset                drop the table
//
// The table lives in memory. The replay endpoint deliberately redacts the
// current round's dice until a challenge reveals them; that is the one privacy
// rule the API can enforce. Local hot-seat play is still a trust-the-room game:
// the active player's own hand is sent to the browser so it can be shown after
// the cover is lifted, and anyone with the page can read it.
//
// No files, no credentials, no outbound requests except through the harness's
// LLM service when an agent seat is configured.

import { randomBytes } from 'node:crypto'
import {
  createMatch,
  publicState,
  applyBid,
  challenge,
  advanceRound,
  recordReferee,
  buildReplay,
} from './game.js'
import {
  heuristicAction,
  parseAgentReply,
  validateAgentAction,
  buildAgentPrompt,
  refereeFallback,
  buildRefereePrompt,
  cleanReferee,
} from './bot.js'

export const name = 'dsh-liars-dice'
export const inject = ['webServer']

const MAX_TABLES = 32
const MAX_BODY = 1048576
const LLM_TIMEOUT_MS = 15000
const REFEREE_TIMEOUT_MS = 12000
const TABLE_ID = /^[a-zA-Z0-9_-]{1,64}$/

const DEFAULTS = {
  players: [
    { name: '你', kind: 'human' },
    { name: '阿骰', kind: 'agent' },
  ],
  dicePerPlayer: 5,
  wildOnes: true,
  referee: true,
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise(function (resolve) {
    let raw = ''
    let tooLarge = false
    req.on('data', function (chunk) {
      if (tooLarge) return
      raw += chunk
      if (raw.length > MAX_BODY) {
        tooLarge = true
        raw = ''
        req.destroy()
        resolve({ ok: false, tooLarge: true })
      }
    })
    req.on('end', function () {
      if (tooLarge) return resolve({ ok: false, tooLarge: true })
      try {
        const value = raw.length > 0 ? JSON.parse(raw) : {}
        resolve(value && typeof value === 'object' ? { ok: true, value: value } : { ok: true, value: {} })
      } catch (error) {
        resolve({ ok: false, badJson: true })
      }
    })
    req.on('error', function () {
      resolve({ ok: false, badJson: true })
    })
  })
}

function splitUrl(url) {
  const text = String(url || '')
  const index = text.indexOf('?')
  const path = index >= 0 ? text.slice(0, index) : text
  const query = new URLSearchParams(index >= 0 ? text.slice(index + 1) : '')
  const method = path.replace(/^\/dsh-liars-dice\/?/, '') || 'state'
  return { method: method, query: query }
}

function tableIdOf(value) {
  const text = typeof value === 'string' && value.length > 0 ? value : 'default'
  return TABLE_ID.test(text) ? text : null
}

function llmInfo(ctx) {
  const llm = ctx.get('llm')
  return {
    available: llm !== undefined,
    referee: llm !== undefined ? 'agent' : 'rule',
  }
}

function currentSelection(ctx) {
  const models = ctx.get('agentDefaultModel')
  if (models === undefined) return undefined
  try {
    const selection = models.currentSelection()
    if (selection && selection.provider && selection.model) {
      return { provider: selection.provider, model: selection.model, reasoningEffort: selection.reasoningEffort }
    }
  } catch (error) {
    return undefined
  }
  return undefined
}

async function firstRoute(llm) {
  try {
    const providers = llm.listProviders()
    for (const entry of providers) {
      const models = await llm.listModels(entry.id)
      if (models.length > 0) return { provider: entry.id, model: models[0].id }
    }
  } catch (error) {
    return undefined
  }
  return undefined
}

async function streamText(llm, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(function () { controller.abort() }, timeoutMs)
  let out = ''
  try {
    for await (const chunk of llm.stream(Object.assign({}, options, { signal: controller.signal }))) {
      if (chunk.type === 'text-delta' && chunk.text) {
        out += chunk.text
      } else if (chunk.type === 'finish' && chunk.reason && (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted')) {
        const message = chunk.reason.failure && chunk.reason.failure.message
        return { ok: false, error: message || ('finish ' + chunk.reason.kind) }
      }
    }
    return { ok: true, text: out }
  } catch (error) {
    return { ok: false, error: String((error && error.message) || error) }
  } finally {
    clearTimeout(timer)
  }
}

export function apply(ctx, config) {
  const settings = config && typeof config === 'object' ? config : {}
  const maxTables = Number.isInteger(settings.maxTables) ? Math.max(1, settings.maxTables) : MAX_TABLES
  const tables = new Map()
  let routeCache = { at: 0, route: undefined }

  function llmInfoNow() {
    return llmInfo(ctx)
  }

  async function resolveRoute(llm) {
    const now = Date.now()
    if (routeCache.route !== undefined && now - routeCache.at < 30000) return routeCache.route
    if (routeCache.route === undefined && now - routeCache.at < 5000) return undefined
    let route = currentSelection(ctx)
    if (route === undefined) route = await firstRoute(llm)
    routeCache = { at: now, route: route }
    return route
  }

  function remember(tableId, state) {
    tables.set(tableId, state)
    while (tables.size > maxTables) {
      let oldestId
      let oldestAt = Infinity
      for (const [id, candidate] of tables) {
        if (candidate.updatedAt < oldestAt) {
          oldestAt = candidate.updatedAt
          oldestId = id
        }
      }
      if (oldestId === undefined) break
      tables.delete(oldestId)
    }
  }

  function payload(tableId, state) {
    return {
      ok: true,
      tableId: tableId,
      table: publicState(state),
      llm: llmInfoNow(),
      defaults: DEFAULTS,
    }
  }

  function errorPayload(message) {
    return { ok: false, error: message }
  }

  function tableFor(tableId) {
    return tables.get(tableId)
  }

  async function agentMove(state, playerId) {
    const player = state.players.find(function (p) { return p.id === playerId })
    if (!player) return { ok: false, error: '玩家不存在' }
    if (player.kind !== 'agent') return { ok: false, error: '这个座位不是 Agent' }
    if (state.phase !== 'bidding') return { ok: false, error: '当前不是叫价阶段' }
    if (state.players[state.turnIndex] !== player) return { ok: false, error: '还没轮到这个 Agent' }

    let action
    let source = 'rule'
    const llm = ctx.get('llm')
    if (llm !== undefined) {
      const route = await resolveRoute(llm)
      if (route !== undefined) {
        const reply = await streamText(llm, {
          provider: route.provider,
          model: route.model,
          system: '你是一个会诈唬也会算概率的吹牛骰子对手。只输出合法的 JSON 动作，不解释。',
          messages: [{
            id: 'liars-dice-' + state.round + '-' + playerId,
            role: 'user',
            content: [{ type: 'text', text: buildAgentPrompt(state, playerId) }],
            source: { kind: 'plugin', plugin: 'dsh-liars-dice' },
          }],
          temperature: 0.8,
          maxTokens: 180,
          ...(route.reasoningEffort ? { reasoningEffort: route.reasoningEffort } : {}),
        }, LLM_TIMEOUT_MS)
        if (reply.ok) {
          const parsed = parseAgentReply(reply.text)
          if (parsed && validateAgentAction(state, playerId, parsed).ok) {
            action = parsed
            source = 'llm'
          }
        }
      }
    }

    if (!action) {
      const fallback = heuristicAction(state, playerId, {})
      if (!fallback.ok) return fallback
      action = fallback
      source = 'rule'
    }

    if (action.action === 'challenge') {
      const result = challenge(state, playerId, { note: action.say, via: source, now: Date.now() })
      return Object.assign({ source: source }, result)
    }
    const result = applyBid(state, playerId, action.qty, action.face, { note: action.say, via: source })
    return Object.assign({ source: source }, result)
  }

  async function refereeFor(state) {
    if (state.phase !== 'reveal' || !state.reveal) return { ok: false, error: '只有开盅后才能点评' }
    if (!state.config.referee) return { ok: false, error: '裁判点评已关闭' }
    if (state.reveal.referee) return { ok: false, error: '这一局已经有点评了' }

    let text = ''
    let source = 'rule'
    const llm = ctx.get('llm')
    if (llm !== undefined) {
      const route = await resolveRoute(llm)
      if (route !== undefined) {
        const reply = await streamText(llm, {
          provider: route.provider,
          model: route.model,
          system: '你是中文吹牛骰子的赛后裁判，只做复盘，不改判。说人话，2 到 3 句。',
          messages: [{
            id: 'liars-dice-referee-' + state.round,
            role: 'user',
            content: [{ type: 'text', text: buildRefereePrompt(state) }],
            source: { kind: 'plugin', plugin: 'dsh-liars-dice' },
          }],
          temperature: 0.4,
          maxTokens: 220,
          ...(route.reasoningEffort ? { reasoningEffort: route.reasoningEffort } : {}),
        }, REFEREE_TIMEOUT_MS)
        if (reply.ok) {
          const cleaned = cleanReferee(reply.text)
          if (cleaned.length > 0) {
            text = cleaned
            source = 'llm'
          }
        }
      }
    }
    if (text.length === 0) text = refereeFallback(state)
    const result = recordReferee(state, text, source, { now: Date.now() })
    return Object.assign({ source: source }, result)
  }

  ctx.effect(function () {
    let disposeRoute
    try {
      disposeRoute = ctx.webServer.register({
        kind: 'prefix',
        path: '/dsh-liars-dice',
        handler: async function (req, res) {
          try {
            const parsedUrl = splitUrl(req.url)
            const method = parsedUrl.method
            const queryTable = parsedUrl.query.get('table')

            if (req.method === 'GET') {
              if (method !== 'state' && method !== 'replay') {
                sendJson(res, 404, errorPayload('未知方法'))
                return
              }
              const tableId = tableIdOf(queryTable)
              if (tableId === null) {
                sendJson(res, 400, errorPayload('table 参数不合法'))
                return
              }
              const state = tableFor(tableId)
              if (!state) {
                if (method === 'state') {
                  sendJson(res, 200, {
                    ok: true,
                    tableId: tableId,
                    table: null,
                    llm: llmInfoNow(),
                    defaults: DEFAULTS,
                  })
                } else {
                  sendJson(res, 404, errorPayload('还没有可复盘的记录'))
                }
                return
              }
              if (method === 'state') {
                sendJson(res, 200, payload(tableId, state))
              } else {
                sendJson(res, 200, {
                  ok: true,
                  tableId: tableId,
                  replay: buildReplay(state),
                  llm: llmInfoNow(),
                })
              }
              return
            }

            if (req.method !== 'POST') {
              sendJson(res, 405, errorPayload('method not allowed'))
              return
            }

            const bodyResult = await readBody(req)
            if (bodyResult.tooLarge) {
              sendJson(res, 413, errorPayload('请求体超过 1 MiB'))
              return
            }
            if (bodyResult.badJson) {
              sendJson(res, 400, errorPayload('请求体不是合法 JSON'))
              return
            }
            const body = bodyResult.value
            const tableId = tableIdOf(body.table || queryTable)
            if (tableId === null) {
              sendJson(res, 400, errorPayload('table 参数不合法'))
              return
            }

            if (method === 'new') {
              let state
              try {
                state = createMatch(body.config || body, {
                  seed: randomBytes(16).toString('hex'),
                  now: Date.now(),
                })
              } catch (error) {
                sendJson(res, 400, errorPayload(String((error && error.message) || error)))
                return
              }
              remember(tableId, state)
              sendJson(res, 200, payload(tableId, state))
              return
            }

            const state = tableFor(tableId)
            if (!state) {
              sendJson(res, 404, errorPayload('还没有对局，请先开桌'))
              return
            }

            if (method === 'reset') {
              tables.delete(tableId)
              sendJson(res, 200, { ok: true, tableId: tableId, table: null })
              return
            }

            if (method === 'bid') {
              const playerId = body.playerId || (state.players[state.turnIndex] && state.players[state.turnIndex].id)
              const result = applyBid(state, playerId, body.qty, body.face, { note: body.note, via: 'human' })
              if (!result.ok) {
                sendJson(res, 400, errorPayload(result.error))
                return
              }
              sendJson(res, 200, payload(tableId, state))
              return
            }

            if (method === 'challenge') {
              const playerId = body.playerId || (state.players[state.turnIndex] && state.players[state.turnIndex].id)
              const result = challenge(state, playerId, { now: Date.now() })
              if (!result.ok) {
                sendJson(res, 400, errorPayload(result.error))
                return
              }
              sendJson(res, 200, payload(tableId, state))
              return
            }

            if (method === 'next') {
              const result = advanceRound(state, { now: Date.now() })
              if (!result.ok) {
                sendJson(res, 400, errorPayload(result.error))
                return
              }
              sendJson(res, 200, payload(tableId, state))
              return
            }

            if (method === 'agent') {
              const playerId = body.playerId || (state.players[state.turnIndex] && state.players[state.turnIndex].id)
              if (state.agentBusy) {
                sendJson(res, 409, errorPayload('Agent 正在思考'))
                return
              }
              state.agentBusy = true
              state.updatedAt = Date.now()
              let source
              try {
                const result = await agentMove(state, playerId)
                if (!result.ok) {
                  sendJson(res, 400, errorPayload(result.error))
                  return
                }
                source = result.source
              } finally {
                state.agentBusy = false
                state.updatedAt = Date.now()
              }
              sendJson(res, 200, Object.assign(payload(tableId, state), { action: source }))
              return
            }

            if (method === 'referee') {
              if (state.refereeBusy) {
                sendJson(res, 409, errorPayload('裁判正在复盘'))
                return
              }
              state.refereeBusy = true
              state.updatedAt = Date.now()
              let source
              try {
                const result = await refereeFor(state)
                if (!result.ok) {
                  sendJson(res, 400, errorPayload(result.error))
                  return
                }
                source = result.source
              } finally {
                state.refereeBusy = false
                state.updatedAt = Date.now()
              }
              sendJson(res, 200, Object.assign(payload(tableId, state), { action: source }))
              return
            }

            sendJson(res, 404, errorPayload('未知方法'))
          } catch (error) {
            sendJson(res, 500, errorPayload(String((error && error.message) || error)))
          }
        },
      })
    } catch (error) {
      disposeRoute = undefined
    }
    return function () {
      if (typeof disposeRoute === 'function') disposeRoute()
      tables.clear()
    }
  })
}

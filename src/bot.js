// Agent half of dsh-liars-dice.
//
// Two jobs:
//
//   1. Opponent: choose a legal bid or a challenge. The LLM is asked for a
//      small JSON object and never sees another seat's hidden dice; every
//      reply is re-validated against the rules. A deterministic probability
//      bot is the fallback, so the table keeps moving when no model is
//      configured or the model misbehaves.
//   2. Referee: after a challenge, explain the outcome in Chinese using the
//      odds the challenger could have computed at the table. The referee is a
//      commentator, never an adjudicator: the rules decide the result.

import { allLegalBids, isLegalBid, totalDice } from './game.js'
import { bidProbability, faceOptions, oddsForBid } from './odds.js'

const SAY_BID = [
  '这口我压得住。',
  '先抬一手，看看谁先眨眼。',
  '别急着开，骰子还没说话。',
  '我这儿有点底，跟一口。',
  '数字不大，胆子不小。',
]

const SAY_CHALLENGE = [
  '这数不对，开。',
  '我不信，开盅。',
  '你这口叫得太满了。',
  '别演了，掀开看看。',
  '概率不站你这边，开。',
]

function hashText(text) {
  let hash = 2166136261
  const value = String(text)
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function stateRng(state, playerId) {
  const bidSeq = state.currentBid ? state.currentBid.seq : 0
  return mulberry32(hashText(String(state.seed) + '|' + state.round + '|' + playerId + '|' + bidSeq))
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length) % list.length]
}

function playerOf(state, playerId) {
  return state.players.find(function (p) { return p.id === playerId })
}

function hiddenDice(state, player) {
  return totalDice(state) - player.dice.length
}

function bestSafeBid(state, player, rng) {
  const unknown = hiddenDice(state, player)
  const legal = allLegalBids(state)
  if (legal.length === 0) return null
  const scored = legal.map(function (bid) {
    const p = bidProbability(player.dice, unknown, bid.qty, bid.face, state.config.wildOnes)
    return { qty: bid.qty, face: bid.face, p: p }
  })
  const safe = scored.filter(function (candidate) { return candidate.p >= 0.62 })
  if (safe.length > 0) {
    // Among safe bids, take the highest quantity instead of the most certain
    // one. A 1-in-1 opening with a known 1 is technically safe but it parks the
    // table; pressure is what makes the next player decide.
    safe.sort(function (a, b) {
      if (b.qty !== a.qty) return b.qty - a.qty
      if (b.p !== a.p) return b.p - a.p
      return a.face - b.face
    })
    return safe[0]
  }
  // Bluff occasionally: a bid that is not likely to be true but is still legal.
  if (rng() < 0.22) {
    const risky = scored.filter(function (candidate) { return candidate.p >= 0.42 })
    if (risky.length > 0) {
      risky.sort(function (a, b) {
        if (b.qty !== a.qty) return b.qty - a.qty
        return a.face - b.face
      })
      return risky[0]
    }
  }
  return scored.sort(function (a, b) { return b.p - a.p })[0]
}

export function heuristicAction(state, playerId, options) {
  const opts = options && typeof options === 'object' ? options : {}
  const player = playerOf(state, playerId)
  if (!player) return { ok: false, error: '玩家不存在' }
  if (state.phase !== 'bidding') return { ok: false, error: '当前不是叫价阶段' }
  if (state.players[state.turnIndex] !== player) return { ok: false, error: '还没轮到这个座位' }
  const rng = typeof opts.rng === 'function' ? opts.rng : stateRng(state, playerId)
  const unknown = hiddenDice(state, player)
  const legal = allLegalBids(state)

  if (legal.length === 0) {
    return {
      ok: true,
      action: 'challenge',
      say: pick(SAY_CHALLENGE, rng),
      source: 'rule',
      reason: 'no-legal-bid',
    }
  }

  const bid = state.currentBid
  if (bid) {
    const odds = oddsForBid({
      hand: player.dice,
      unknownDice: unknown,
      qty: bid.qty,
      face: bid.face,
      wildOnes: state.config.wildOnes,
    })
    const roll = rng()
    if (odds.challengeWin >= 0.58 || (odds.challengeWin >= 0.5 && roll < 0.55)) {
      return {
        ok: true,
        action: 'challenge',
        say: pick(SAY_CHALLENGE, rng),
        source: 'rule',
        reason: 'challenge-odds',
        odds: odds,
      }
    }
  }

  const candidate = bestSafeBid(state, player, rng)
  if (!candidate) {
    return {
      ok: true,
      action: 'challenge',
      say: pick(SAY_CHALLENGE, rng),
      source: 'rule',
      reason: 'no-safe-bid',
    }
  }

  if (bid) {
    const odds = oddsForBid({
      hand: player.dice,
      unknownDice: unknown,
      qty: bid.qty,
      face: bid.face,
      wildOnes: state.config.wildOnes,
    })
    // A weak hand facing a plausible bid should open rather than throw a die
    // at an impossible raise.
    if (odds.challengeWin >= 0.42 && candidate.p < 0.55 && rng() < 0.5) {
      return {
        ok: true,
        action: 'challenge',
        say: pick(SAY_CHALLENGE, rng),
        source: 'rule',
        reason: 'price-too-high',
        odds: odds,
      }
    }
  }

  return {
    ok: true,
    action: 'bid',
    qty: candidate.qty,
    face: candidate.face,
    say: pick(SAY_BID, rng),
    source: 'rule',
    reason: 'raise',
    probability: candidate.p,
  }
}

function tableTalk(text, max) {
  if (typeof text !== 'string') return ''
  return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 40)
}

export function parseAgentReply(text) {
  if (typeof text !== 'string') return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  let parsed
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch (error) {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const action = parsed.action === 'challenge'
    ? 'challenge'
    : (parsed.action === 'bid' ? 'bid' : null)
  if (!action) return null
  const out = {
    action: action,
    say: tableTalk(parsed.say, 40),
  }
  if (action === 'bid') {
    out.qty = Number.isInteger(parsed.qty) ? parsed.qty : Number(parsed.qty)
    out.face = Number.isInteger(parsed.face) ? parsed.face : Number(parsed.face)
    if (!Number.isInteger(out.qty) || !Number.isInteger(out.face)) return null
  }
  return out
}

export function validateAgentAction(state, playerId, action) {
  if (!action || typeof action !== 'object') return { ok: false, error: '动作不是对象' }
  if (action.action === 'challenge') {
    if (!state.currentBid) return { ok: false, error: '还没有人叫价' }
    return { ok: true }
  }
  if (action.action === 'bid') {
    if (!isLegalBid(state, action.qty, action.face)) return { ok: false, error: '这一口不合法' }
    return { ok: true }
  }
  return { ok: false, error: '未知动作' }
}

export function buildAgentPrompt(state, playerId) {
  const player = playerOf(state, playerId)
  if (!player) return ''
  const total = totalDice(state)
  const unknown = total - player.dice.length
  const legal = allLegalBids(state)
  const bid = state.currentBid
  const bidder = bid ? playerOf(state, bid.playerId) : null
  const alive = state.players.filter(function (p) { return p.alive }).map(function (p) {
    return p.name + '（' + (p.kind === 'agent' ? 'Agent' : '真人') + '，' + p.diceCount + ' 颗' + (p.id === playerId ? '，你' : '') + '）'
  })
  const recent = state.events
    .filter(function (event) { return event.type === 'bid' || event.type === 'challenge' })
    .slice(-6)
    .map(function (event) {
      if (event.type === 'bid') {
        const by = playerOf(state, event.playerId)
        return '第' + event.round + '回合 ' + (by ? by.name : '?') + ' 叫 ' + event.qty + ' 个 ' + event.face
      }
      return '第' + event.round + '回合 开盅：实际 ' + event.actual + ' 个 ' + event.target.face
    })
  const legalText = legal.slice(0, 12).map(function (entry) {
    return entry.qty + '个' + entry.face
  }).join('、')
  const faceCounts = faceOptions(player.dice, state.config.wildOnes).map(function (entry) {
    return entry.face + ':' + entry.known
  }).join(' ')
  return [
    '你在玩中文吹牛骰子（Liar\'s Dice），你是「' + player.name + '」。',
    '规则：每回合所有存活玩家各摇 ' + state.config.dicePerPlayer + ' 颗骰子，只看自己的；轮流叫「数量+点数」，后一口必须更大（数量更大，或数量相同点数更大）；可以开盅。开盅后数全场该点数，' +
      (state.config.wildOnes ? '1 可以当任何非 1 的点数，但叫 1 时只数真的 1。' : '1 不当万能。') +
      '叫价成立则开盅者输一颗骰，不成立则叫价者输一颗；骰子归零出局；最后剩一人获胜。',
    '你的手骰：' + player.dice.join(' ') + '（各点数含 1 的计数：' + faceCounts + '）',
    '全场存活：' + alive.join('；') + '。总骰数 ' + total + '，你之外还有 ' + unknown + ' 颗未知骰。',
    bid
      ? '当前叫价：' + (bidder ? bidder.name : '?') + ' 叫 ' + bid.qty + ' 个 ' + bid.face + '（第 ' + state.round + ' 回合）。'
      : '当前还没有人叫价，你可以开一个头。',
    recent.length > 0 ? '最近的叫价/开盅：' + recent.join('；') : '',
    legal.length > 0 ? '当前合法叫价示例：' + legalText + '。' : '没有更大的叫价了，只能开盅。',
    '你可以诈唬，但必须给出一个合法的动作。只输出一个 JSON 对象，不要 markdown：',
    '{"action":"bid","qty":数量,"face":点数,"say":"一句不超过 24 字的中文桌边话"}',
    '{"action":"challenge","say":"一句不超过 24 字的中文桌边话"}',
  ].filter(Boolean).join('\n')
}

export function refereeFallback(state) {
  const reveal = state.reveal
  if (!reveal) return ''
  const bidder = playerOf(state, reveal.bidderId)
  const challenger = playerOf(state, reveal.challengerId)
  const odds = reveal.oddsAtChallenge
  const pct = odds ? Math.round(odds.challengeWin * 100) : null
  const parts = []
  parts.push(
    (bidder ? bidder.name : '叫价方') + ' 叫 ' + reveal.qty + ' 个 ' + reveal.face +
    '，开盅实际 ' + reveal.actual + ' 个 ' + reveal.face + '，叫价' + (reveal.bidTrue ? '成立' : '不成立') + '。'
  )
  parts.push((reveal.loserId === reveal.bidderId ? (bidder ? bidder.name : '叫价方') : (challenger ? challenger.name : '开盅方')) + ' 输一颗骰。')
  if (reveal.eliminated) parts.push('这一颗让 ' + (reveal.loserId === reveal.bidderId ? (bidder ? bidder.name : '叫价方') : (challenger ? challenger.name : '开盅方')) + ' 出局。')
  if (pct !== null) {
    let verdict = '接近五五开'
    if (pct <= 5) verdict = '几乎没有胜算'
    else if (pct < 30) verdict = '概率上很不划算'
    else if (pct < 45) verdict = '概率上偏冒险'
    else if (pct >= 70) verdict = '概率上很划算'
    parts.push('开盅方当时按自己的手骰估算胜率 ' + pct + '%，这次开盅' + verdict + '。')
  }
  return parts.join('')
}

export function buildRefereePrompt(state) {
  const reveal = state.reveal
  if (!reveal) return ''
  const bidder = playerOf(state, reveal.bidderId)
  const challenger = playerOf(state, reveal.challengerId)
  const hands = Object.keys(reveal.hands).map(function (id) {
    const player = playerOf(state, id)
    return (player ? player.name : id) + '：' + reveal.hands[id].join(' ')
  }).join('；')
  const odds = reveal.oddsAtChallenge
  const pct = odds ? Math.round(odds.challengeWin * 100) : null
  return [
    '你是这桌中文吹牛骰子的裁判，只做赛后复盘，不改判。',
    '第 ' + state.round + ' 回合：' + (bidder ? bidder.name : '?') + ' 叫 ' + reveal.qty + ' 个 ' + reveal.face + '；' +
      (challenger ? challenger.name : '?') + ' 开盅。',
    '开盅结果：全场实际 ' + reveal.actual + ' 个 ' + reveal.face + '，叫价' + (reveal.bidTrue ? '成立' : '不成立') + '，' +
      (reveal.loserId === reveal.bidderId ? (bidder ? bidder.name : '叫价方') : (challenger ? challenger.name : '开盅方')) + ' 输一颗骰。',
    '全场手骰（开盅后公开）：' + hands + '。',
    pct !== null ? '开盅方在开盅前的胜率估算：' + pct + '%（按自己的手骰和未知骰计算）。' : '',
    '用 2 到 3 句中文点评：这次开盅/叫价在概率上是否合理，关键在哪。不要复述规则，不要输出 markdown，不超过 120 字。',
  ].filter(Boolean).join('\n')
}

export function cleanReferee(text) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```$/i, '')
    .replace(/[*_#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240)
}

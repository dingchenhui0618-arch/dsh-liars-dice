import { strict as assert } from 'node:assert'
import test from 'node:test'
import { apply } from '../src/host.js'

function stubLlm(reply) {
  const calls = []
  return {
    calls: calls,
    async *stream(options) {
      calls.push(options)
      const text = typeof reply === 'function' ? reply(options) : reply
      if (text !== undefined && text !== null) yield { type: 'text-delta', text: text }
    },
  }
}

function setup(options) {
  const settings = options || {}
  const routes = []
  const disposers = []
  const webServer = {
    register(route) {
      if (settings.registerThrows === true) throw new Error('webServer.register is unavailable')
      routes.push(route)
      return function () {
        const index = routes.indexOf(route)
        if (index >= 0) routes.splice(index, 1)
      }
    },
  }
  const services = {
    webServer: webServer,
    agentDefaultModel: { currentSelection: () => ({ provider: 'test', model: 'stub' }) },
  }
  if (settings.llm !== undefined) services.llm = settings.llm
  const ctx = {
    webServer: webServer,
    get(name) { return services[name] },
    effect(fn) {
      const dispose = fn()
      const wrapped = typeof dispose === 'function' ? dispose : function () {}
      disposers.push(wrapped)
      return wrapped
    },
  }
  apply(ctx, { maxTables: settings.maxTables })
  return {
    routes: routes,
    dispose() {
      const pending = disposers.splice(0)
      for (const dispose of pending) dispose()
    },
    async call(method, body, opts) {
      const config = opts || {}
      const route = routes[0]
      assert.ok(route, 'route is registered')
      const query = config.table === null ? '' : '?table=' + encodeURIComponent(config.table || 't1')
      const url = '/dsh-liars-dice/' + method + query
      const req = {
        method: config.httpMethod || (body === undefined ? 'GET' : 'POST'),
        url: url,
        _listeners: {},
        _sent: false,
        on(event, fn) {
          this._listeners[event] = fn
          if (event === 'end' && !this._sent) {
            this._sent = true
            const self = this
            setImmediate(function () {
              if (self._listeners.data) self._listeners.data(JSON.stringify(body === undefined ? {} : body))
              if (self._listeners.end) self._listeners.end()
            })
          }
          return this
        },
        destroy() {},
      }
      const res = {
        statusCode: 200,
        headers: {},
        setHeader(key, value) { this.headers[key] = value },
        end(text) { this.body = text },
      }
      await route.handler(req, res)
      return {
        status: res.statusCode,
        headers: res.headers,
        body: res.body === undefined ? undefined : JSON.parse(res.body),
      }
    },
  }
}

const HUMAN_TWO = {
  players: [{ name: '甲', kind: 'human' }, { name: '乙', kind: 'human' }],
  dicePerPlayer: 5,
  wildOnes: true,
  referee: true,
}

test('the route is a prefixed handler and unloading removes it', () => {
  const h = setup({})
  assert.equal(h.routes.length, 1)
  assert.equal(h.routes[0].kind, 'prefix')
  assert.equal(h.routes[0].path, '/dsh-liars-dice')
  h.dispose()
  assert.equal(h.routes.length, 0)
})

test('GET state before a match returns setup defaults', async () => {
  const h = setup({})
  const out = await h.call('state')
  assert.equal(out.status, 200)
  assert.equal(out.body.ok, true)
  assert.equal(out.body.table, null)
  assert.equal(out.body.defaults.players.length, 2)
  assert.equal(out.body.defaults.players[1].kind, 'agent')
})

test('POST new creates a match with hidden hands and no seed', async () => {
  const h = setup({})
  const out = await h.call('new', { config: { ...HUMAN_TWO, dicePerPlayer: 3 } })
  assert.equal(out.status, 200)
  assert.equal(out.body.ok, true)
  assert.equal(out.body.table.phase, 'bidding')
  assert.equal(out.body.table.players.length, 2)
  assert.equal(out.body.table.activeHand.length, 3)
  assert.equal(out.body.table.totalDice, 6)
  assert.equal(out.body.table.llm, undefined)
  assert.equal(JSON.stringify(out.body).includes('"seed"'), false)
  assert.equal(out.body.llm.available, false)
})

test('an invalid new request is rejected without throwing', async () => {
  const h = setup({})
  const one = await h.call('new', { players: [{ name: '独' }] })
  assert.equal(one.status, 400)
  assert.equal(one.body.ok, false)
  assert.match(one.body.error, /至少/)
})

test('bid, challenge and next walk the table through a round', async () => {
  const h = setup({})
  let out = await h.call('new', HUMAN_TWO)
  assert.equal(out.body.table.turnId, 'p1')
  out = await h.call('bid', { playerId: 'p1', qty: 2, face: 3 })
  assert.equal(out.status, 200)
  assert.equal(out.body.table.currentBid.qty, 2)
  assert.equal(out.body.table.currentBid.face, 3)
  assert.equal(out.body.table.turnId, 'p2')

  const wrong = await h.call('bid', { playerId: 'p1', qty: 3, face: 3 })
  assert.equal(wrong.status, 400)
  assert.equal(wrong.body.ok, false)

  out = await h.call('challenge', { playerId: 'p2' })
  assert.equal(out.status, 200)
  assert.equal(out.body.table.phase, 'reveal')
  assert.ok(out.body.table.reveal.hands.p1.length === 5)
  assert.equal(typeof out.body.table.reveal.actual, 'number')
  assert.equal(out.body.table.activeHand, null)

  out = await h.call('next', {})
  assert.equal(out.status, 200)
  assert.equal(out.body.table.phase, 'bidding')
  assert.equal(out.body.table.round, 2)
  assert.equal(out.body.table.reveal, null)
})

test('an agent seat bids through the model and validates the reply', async () => {
  const llm = stubLlm('{"action":"bid","qty":2,"face":2,"say":"跟一口"}')
  const h = setup({ llm: llm })
  let out = await h.call('new', {
    players: [{ name: '人', kind: 'human' }, { name: '机', kind: 'agent' }],
    dicePerPlayer: 5,
    wildOnes: true,
  })
  await h.call('bid', { playerId: 'p1', qty: 1, face: 1 })
  out = await h.call('agent', {})
  assert.equal(out.status, 200)
  assert.equal(out.body.action, 'llm')
  assert.equal(out.body.table.currentBid.playerId, 'p2')
  assert.equal(out.body.table.currentBid.qty, 2)
  assert.equal(out.body.table.agentBusy, false)
  assert.equal(llm.calls.length, 1)
  const prompt = llm.calls[0].messages[0].content[0].text
  assert.match(prompt, /你的手骰/)
  assert.equal(prompt.includes('p2 的隐藏手骰'), false)
})

test('an invalid or absent model reply falls back to the rule opponent', async () => {
  const invalid = stubLlm('I think I will bid three fours, probably.')
  const h = setup({ llm: invalid })
  let out = await h.call('new', {
    players: [{ name: '人', kind: 'human' }, { name: '机', kind: 'agent' }],
    dicePerPlayer: 5,
  })
  await h.call('bid', { playerId: 'p1', qty: 1, face: 1 })
  out = await h.call('agent', {})
  assert.equal(out.status, 200)
  assert.equal(out.body.action, 'rule')
  assert.ok(out.body.table)
  assert.equal(out.body.table.agentBusy, false)

  const noLlm = setup({})
  let out2 = await noLlm.call('new', {
    players: [{ name: '人', kind: 'human' }, { name: '机', kind: 'agent' }],
    dicePerPlayer: 5,
  })
  await noLlm.call('bid', { playerId: 'p1', qty: 1, face: 1 })
  out2 = await noLlm.call('agent', {})
  assert.equal(out2.status, 200)
  assert.equal(out2.body.action, 'rule')
  assert.equal(out2.body.table.agentBusy, false)
})

test('the referee writes one commentary entry after a challenge', async () => {
  const llm = stubLlm('这次开盅在概率上站得住，因为叫价已经超过了已知骰的支撑。')
  const h = setup({ llm: llm })
  await h.call('new', HUMAN_TWO)
  await h.call('bid', { playerId: 'p1', qty: 2, face: 2 })
  let out = await h.call('challenge', { playerId: 'p2' })
  assert.equal(out.body.table.reveal.referee, null)
  out = await h.call('referee', {})
  assert.equal(out.status, 200)
  assert.equal(out.body.action, 'llm')
  assert.equal(out.body.table.reveal.referee.source, 'llm')
  assert.match(out.body.table.reveal.referee.text, /开盅/)
  assert.equal(out.body.table.refereeBusy, false)
  assert.equal(llm.calls.length, 1)
})

test('the referee falls back to rule text without a model', async () => {
  const h = setup({})
  await h.call('new', HUMAN_TWO)
  await h.call('bid', { playerId: 'p1', qty: 2, face: 2 })
  await h.call('challenge', { playerId: 'p2' })
  const out = await h.call('referee', {})
  assert.equal(out.status, 200)
  assert.equal(out.body.action, 'rule')
  assert.match(out.body.table.reveal.referee.text, /胜率|输一颗骰/)
})

test('a disabled referee refuses to comment', async () => {
  const h = setup({})
  await h.call('new', { ...HUMAN_TWO, referee: false })
  await h.call('bid', { playerId: 'p1', qty: 2, face: 2 })
  await h.call('challenge', { playerId: 'p2' })
  const out = await h.call('referee', {})
  assert.equal(out.status, 400)
  assert.match(out.body.error, /关闭/)
})

test('replay hides the current dice until a challenge', async () => {
  const h = setup({})
  await h.call('new', HUMAN_TWO)
  let out = await h.call('replay')
  assert.equal(out.status, 200)
  assert.equal(out.body.replay.rounds[0].dice, null)
  await h.call('bid', { playerId: 'p1', qty: 2, face: 2 })
  await h.call('challenge', { playerId: 'p2' })
  out = await h.call('replay')
  assert.equal(out.body.replay.rounds[0].revealed, true)
  assert.equal(out.body.replay.rounds[0].dice.p1.length, 5)
  assert.equal(out.body.replay.match.totals.challenges, 1)
})

test('two table ids keep independent matches', async () => {
  const h = setup({})
  await h.call('new', HUMAN_TWO, { table: 'a' })
  await h.call('new', {
    players: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'human' }, { name: 'C', kind: 'human' }],
    dicePerPlayer: 3,
  }, { table: 'b' })
  const a = await h.call('state', undefined, { table: 'a' })
  const b = await h.call('state', undefined, { table: 'b' })
  assert.equal(a.body.table.players.length, 2)
  assert.equal(b.body.table.players.length, 3)
  await h.call('reset', {}, { table: 'a' })
  const gone = await h.call('state', undefined, { table: 'a' })
  assert.equal(gone.body.table, null)
  const still = await h.call('state', undefined, { table: 'b' })
  assert.equal(still.body.table.players.length, 3)
})

test('unloading clears tables and the route still answers with an empty lobby', async () => {
  const h = setup({})
  await h.call('new', HUMAN_TWO, { table: 'unload' })
  const route = h.routes[0]
  h.dispose()
  assert.equal(h.routes.length, 0)
  const req = {
    method: 'GET',
    url: '/dsh-liars-dice/state?table=unload',
    on() { return this },
  }
  const res = {
    statusCode: 200,
    setHeader() {},
    end(text) { this.body = JSON.parse(text) },
  }
  await route.handler(req, res)
  assert.equal(res.body.table, null)
})

test('bad table ids, unknown methods and unknown routes are rejected', async () => {
  const h = setup({})
  const bad = await h.call('state', undefined, { table: 'bad/id' })
  assert.equal(bad.status, 400)
  const unknown = await h.call('bogus', {})
  assert.equal(unknown.status, 404)
  const put = await h.call('state', undefined, { httpMethod: 'PUT' })
  assert.equal(put.status, 405)
  const replayMissing = await h.call('replay')
  assert.equal(replayMissing.status, 404)
})

test('a webServer that refuses to register does not throw out of apply', () => {
  assert.doesNotThrow(() => setup({ registerThrows: true }))
})

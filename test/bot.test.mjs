import { strict as assert } from 'node:assert'
import test from 'node:test'
import {
  buildAgentPrompt,
  buildRefereePrompt,
  cleanReferee,
  heuristicAction,
  parseAgentReply,
  refereeFallback,
  validateAgentAction,
} from '../src/bot.js'
import {
  advanceRound,
  applyBid,
  challenge,
  createMatch,
  isLegalBid,
} from '../src/game.js'

function twoPlayer(seed, options) {
  return createMatch({
    players: [{ name: '人', kind: 'human' }, { name: '机', kind: 'agent' }],
    dicePerPlayer: 5,
    wildOnes: true,
    referee: true,
    ...(options || {}),
  }, { seed: seed || 'bot-seed', now: 1 })
}

function makeReveal(state) {
  state.players[0].dice = [1, 2, 2, 4, 5]
  state.players[1].dice = [1, 3, 3, 3, 6]
  assert.equal(applyBid(state, 'p1', 3, 3, { now: 2 }).ok, true)
  assert.equal(challenge(state, 'p2', { now: 3 }).ok, true)
}

test('the fallback opponent opens with a legal bid', () => {
  const state = twoPlayer('open')
  const action = heuristicAction(state, 'p1')
  assert.equal(action.ok, true)
  assert.equal(action.action, 'bid')
  assert.equal(isLegalBid(state, action.qty, action.face), true)
  assert.equal(typeof action.say, 'string')
  assert.ok(action.say.length > 0 && action.say.length <= 40)
})

test('the fallback opponent opens the cup when no larger bid exists', () => {
  const state = twoPlayer('no-legal')
  state.currentBid = { qty: 10, face: 6, playerId: 'p2', seq: 1, at: 2 }
  state.turnIndex = 0
  const action = heuristicAction(state, 'p1')
  assert.equal(action.ok, true)
  assert.equal(action.action, 'challenge')
  assert.equal(action.reason, 'no-legal-bid')
})

test('the fallback opponent challenges an implausible bid', () => {
  const state = twoPlayer('implausible')
  state.currentBid = { qty: 9, face: 6, playerId: 'p2', seq: 1, at: 2 }
  state.turnIndex = 0
  const action = heuristicAction(state, 'p1')
  assert.equal(action.ok, true)
  assert.equal(action.action, 'challenge')
})

test('the fallback opponent raises from a strong hand', () => {
  const state = twoPlayer('strong')
  state.players[0].dice = [4, 4, 4, 4, 4]
  state.currentBid = { qty: 1, face: 2, playerId: 'p2', seq: 1, at: 2 }
  state.turnIndex = 0
  const action = heuristicAction(state, 'p1')
  assert.equal(action.ok, true)
  assert.equal(action.action, 'bid')
  assert.equal(isLegalBid(state, action.qty, action.face), true)
})

test('the fallback opponent is deterministic for the same table state', () => {
  const state = twoPlayer('deterministic')
  const copy = JSON.parse(JSON.stringify(state))
  const a = heuristicAction(state, 'p1')
  const b = heuristicAction(copy, 'p1')
  assert.deepEqual(a, b)
})

test('the fallback opponent only ever produces legal actions over many seeds', () => {
  for (let seed = 0; seed < 24; seed += 1) {
    const state = twoPlayer('league-' + seed)
    for (let step = 0; step < 40; step += 1) {
      if (state.phase === 'reveal') {
        advanceRound(state)
        continue
      }
      if (state.phase === 'gameover') break
      const player = state.players[state.turnIndex]
      const action = heuristicAction(state, player.id)
      assert.equal(action.ok, true, 'seed ' + seed + ' step ' + step + ': ' + action.error)
      if (action.action === 'challenge') {
        const result = challenge(state, player.id)
        assert.equal(result.ok, true)
      } else {
        const result = applyBid(state, player.id, action.qty, action.face, { note: action.say })
        assert.equal(result.ok, true)
      }
    }
  }
})

test('agent replies are parsed from plain JSON and fenced JSON', () => {
  const plain = parseAgentReply('{"action":"bid","qty":3,"face":5,"say":"跟一口"}')
  assert.deepEqual(plain, { action: 'bid', qty: 3, face: 5, say: '跟一口' })
  const fenced = parseAgentReply('```json\n{"action":"challenge","say":"开"}\n```')
  assert.deepEqual(fenced, { action: 'challenge', say: '开' })
  assert.equal(parseAgentReply('我觉得可以叫三个四'), null)
  assert.equal(parseAgentReply('{"action":"fold"}'), null)
  assert.equal(parseAgentReply('{"action":"bid","qty":"x","face":4}'), null)
})

test('agent actions are validated against the current table', () => {
  const state = twoPlayer('validate')
  state.currentBid = { qty: 4, face: 3, playerId: 'p2', seq: 1, at: 2 }
  assert.equal(validateAgentAction(state, 'p1', { action: 'bid', qty: 4, face: 2 }).ok, false)
  assert.equal(validateAgentAction(state, 'p1', { action: 'bid', qty: 4, face: 4 }).ok, true)
  assert.equal(validateAgentAction(state, 'p1', { action: 'challenge' }).ok, true)
  assert.equal(validateAgentAction(state, 'p1', { action: 'dance' }).ok, false)
})

test('the opponent prompt contains its own hand but not the hidden hand', () => {
  const state = twoPlayer('prompt')
  state.players[0].dice = [1, 2, 3, 4, 5]
  state.players[1].dice = [2, 2, 2, 2, 2]
  state.currentBid = { qty: 2, face: 3, playerId: 'p2', seq: 1, at: 2 }
  state.turnIndex = 0
  const prompt = buildAgentPrompt(state, 'p1')
  assert.match(prompt, /1 2 3 4 5/)
  assert.equal(prompt.includes('2 2 2 2 2'), false)
  assert.match(prompt, /当前叫价/)
  assert.match(prompt, /JSON/)
  assert.match(prompt, /1 可以当任何非 1 的点数/)
})

test('the referee fallback explains the result and the challenger odds', () => {
  const state = twoPlayer('referee')
  makeReveal(state)
  const text = refereeFallback(state)
  assert.match(text, /开盅实际/)
  assert.match(text, /胜率/)
  assert.match(text, /输一颗骰/)
  assert.ok(text.length > 20)
})

test('the referee fallback says a near-certain opening is a bad challenge', () => {
  const state = twoPlayer('referee-zero')
  makeReveal(state)
  state.reveal.oddsAtChallenge.challengeWin = 0
  const text = refereeFallback(state)
  assert.match(text, /几乎没有胜算/)
  assert.equal(text.includes('偏冒进'), false)

  state.reveal.oddsAtChallenge.challengeWin = 0.82
  assert.match(refereeFallback(state), /概率上很划算/)
})

test('the referee prompt includes the revealed hands and asks for prose', () => {
  const state = twoPlayer('referee-prompt')
  makeReveal(state)
  const prompt = buildRefereePrompt(state)
  assert.match(prompt, /1 2 2 4 5/)
  assert.match(prompt, /不改判/)
  assert.match(prompt, /2 到 3 句/)
})

test('cleanReferee strips markdown and caps the length', () => {
  assert.equal(cleanReferee('**好** 开盅'), '好 开盅')
  assert.equal(cleanReferee('```\n裁判说\n```'), '裁判说')
  assert.ok(cleanReferee('字'.repeat(400)).length <= 240)
  assert.equal(cleanReferee(undefined), '')
})

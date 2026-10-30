import { strict as assert } from 'node:assert'
import test from 'node:test'
import {
  advanceRound,
  allLegalBids,
  applyBid,
  buildReplay,
  challenge,
  createMatch,
  isLegalBid,
  legalBidState,
  normalizeConfig,
  publicState,
  recordReferee,
  rollHand,
  totalDice,
} from '../src/game.js'

const CONFIG = {
  players: [
    { name: '甲', kind: 'human' },
    { name: '乙', kind: 'human' },
  ],
  dicePerPlayer: 5,
  wildOnes: false,
  referee: true,
}

function match(seed, config) {
  return createMatch(config || CONFIG, { seed: seed || 'test-seed', now: 1700000000000 })
}

test('config normalisation clamps dice, defaults names and keeps seat kinds', () => {
  const config = normalizeConfig({
    players: [{ name: '  A  ', kind: 'agent' }, { name: '', kind: 'human' }],
    dicePerPlayer: 99,
  })
  assert.equal(config.players[0].name, 'A')
  assert.equal(config.players[0].kind, 'agent')
  assert.equal(config.players[1].name, '玩家2')
  assert.equal(config.dicePerPlayer, 8)
  assert.equal(config.wildOnes, true)
  assert.equal(config.referee, true)
  assert.throws(() => normalizeConfig({ players: [{ name: 'only' }] }), /至少/)
  const seven = Array.from({ length: 7 }, (_, i) => ({ name: 'p' + i }))
  assert.throws(() => normalizeConfig({ players: seven }), /最多/)
})

test('rollHand is deterministic, in range, and changes with round and seat', () => {
  const a = rollHand('seed', 1, 'p1', 8)
  const b = rollHand('seed', 1, 'p1', 8)
  assert.deepEqual(a, b)
  assert.equal(a.length, 8)
  assert.ok(a.every((d) => Number.isInteger(d) && d >= 1 && d <= 6))
  assert.notDeepEqual(a, rollHand('seed', 2, 'p1', 8))
  assert.notDeepEqual(a, rollHand('seed', 1, 'p2', 8))
})

test('a new match deals hidden dice and records the opening events', () => {
  const state = match()
  assert.equal(state.phase, 'bidding')
  assert.equal(state.round, 1)
  assert.equal(state.players.length, 2)
  assert.ok(state.players.every((p) => p.dice.length === 5 && p.alive))
  assert.equal(totalDice(state), 10)
  assert.deepEqual(state.events.map((e) => e.type), ['match-start', 'round-start'])
  assert.equal(state.events[1].dice.p1.length, 5)
})

test('the public state never exposes the seed or another seat hand', () => {
  const state = match()
  const pub = publicState(state)
  const text = JSON.stringify(pub)
  assert.equal(text.includes('"seed"'), false)
  assert.equal(text.includes('"dice"'), false)
  assert.equal(pub.activeHand.length, 5)
  assert.equal(pub.players.length, 2)
  assert.equal(pub.phase, 'bidding')
})

test('the active hand is withheld when an agent is thinking', () => {
  const state = createMatch({
    players: [{ name: '人', kind: 'human' }, { name: '机', kind: 'agent' }],
    dicePerPlayer: 5,
    wildOnes: false,
  }, { seed: 'agent-turn', now: 1 })
  const bid = applyBid(state, 'p1', 1, 1, { now: 2 })
  assert.equal(bid.ok, true)
  const pub = publicState(state)
  assert.equal(pub.activePlayerId, 'p2')
  assert.equal(pub.activeHand, null)
  assert.equal(pub.odds, null)
})

test('legal bids must beat the previous quantity or face', () => {
  const state = match()
  assert.equal(isLegalBid(state, 1, 1), true)
  assert.equal(isLegalBid(state, 0, 1), false)
  assert.equal(isLegalBid(state, 11, 1), false)
  assert.equal(isLegalBid(state, 1, 7), false)
  assert.equal(allLegalBids(state).length, 60)
  assert.equal(applyBid(state, 'p1', 3, 4, { now: 2 }).ok, true)
  assert.equal(isLegalBid(state, 3, 4), false)
  assert.equal(isLegalBid(state, 3, 5), true)
  assert.equal(isLegalBid(state, 4, 1), true)
  assert.equal(isLegalBid(state, 2, 6), false)
  assert.deepEqual(legalBidState(state).next, { qty: 3, face: 5 })
})

test('bidding enforces turn order and leaves state untouched on failure', () => {
  const fresh = match()
  const before = JSON.stringify(fresh)
  assert.equal(applyBid(fresh, 'p2', 1, 1).ok, false)
  assert.equal(applyBid(fresh, 'p1', 0, 1).ok, false)
  assert.equal(applyBid(fresh, 'p1', 1, 7).ok, false)
  assert.equal(applyBid(fresh, 'p1', 99, 1).ok, false)
  assert.equal(applyBid(fresh, 'p1', 1.5, 2).ok, false)
  assert.equal(JSON.stringify(fresh), before)
})

test('a bid advances the turn and is recorded with a note', () => {
  const state = match()
  const result = applyBid(state, 'p1', 2, 3, { now: 30, note: '先抬一手', via: 'llm' })
  assert.equal(result.ok, true)
  assert.equal(state.currentBid.qty, 2)
  assert.equal(state.currentBid.face, 3)
  assert.equal(state.turnIndex, 1)
  assert.equal(state.players[0].stats.bids, 1)
  const event = state.events.at(-1)
  assert.equal(event.type, 'bid')
  assert.equal(event.note, '先抬一手')
  assert.equal(event.via, 'llm')
  assert.equal(event.at, 30)
})

test('challenging reveals every hand, counts wild ones and removes one die', () => {
  const config = Object.assign({}, CONFIG, { wildOnes: true })
  const state = match('challenge-seed', config)
  // Pin the hands so this test checks the rule, not the RNG.
  state.players[0].dice = [1, 1, 4, 4, 6]
  state.players[1].dice = [1, 4, 2, 3, 5]
  assert.equal(applyBid(state, 'p1', 4, 4, { now: 10 }).ok, true)
  const result = challenge(state, 'p2', { now: 20 })
  assert.equal(result.ok, true)
  assert.equal(state.phase, 'reveal')
  assert.equal(state.reveal.actual, 6) // four 4s + two wild 1s
  assert.equal(state.reveal.bidTrue, true)
  assert.equal(state.reveal.loserId, 'p2')
  assert.equal(state.players[1].diceCount, 4)
  assert.equal(state.players[1].alive, true)
  assert.equal(state.players[0].stats.bluffs, 0)
  assert.equal(state.players[1].stats.challenges, 1)
  assert.equal(state.events.at(-1).type, 'challenge')
  assert.equal(state.events.at(-1).hands.p1.length, 5)
  assert.equal(state.events.at(-1).oddsAtChallenge.qty, 4)
})

test('a false bid costs the bidder a die and counts as a bluff', () => {
  const state = match('false-bid', CONFIG)
  state.players[0].dice = [2, 2, 2, 3, 3]
  state.players[1].dice = [3, 3, 3, 4, 4]
  assert.equal(applyBid(state, 'p1', 3, 6, { now: 1 }).ok, true)
  const result = challenge(state, 'p2', { now: 2 })
  assert.equal(result.ok, true)
  assert.equal(state.reveal.actual, 0)
  assert.equal(state.reveal.bidTrue, false)
  assert.equal(state.reveal.loserId, 'p1')
  assert.equal(state.players[0].diceCount, 4)
  assert.equal(state.players[0].stats.bluffs, 1)
})

test('you cannot open the cup before any bid or out of turn', () => {
  const state = match()
  assert.equal(challenge(state, 'p1').ok, false)
  assert.equal(applyBid(state, 'p1', 1, 1).ok, true)
  assert.equal(challenge(state, 'p1').ok, false)
})

test('the next round starts with the seat that lost the die and rerolls', () => {
  const state = match('next-round', CONFIG)
  const oldP1 = state.players[0].dice.slice()
  assert.equal(applyBid(state, 'p1', 1, 1).ok, true)
  assert.equal(challenge(state, 'p2').ok, true)
  const loser = state.reveal.loserId
  const result = advanceRound(state, { now: 10 })
  assert.equal(result.ok, true)
  assert.equal(state.phase, 'bidding')
  assert.equal(state.round, 2)
  assert.equal(state.currentBid, null)
  assert.equal(state.reveal, null)
  assert.equal(state.players[state.turnIndex].id, loser)
  assert.equal(state.players[state.starterIndex].id, loser)
  assert.equal(state.events.at(-1).type, 'round-start')
  if (loser === 'p1') assert.notDeepEqual(state.players[0].dice, oldP1)
})

test('a seat at zero dice is eliminated and the last seat wins', () => {
  const state = createMatch({
    players: [{ name: '甲', kind: 'human' }, { name: '乙', kind: 'human' }],
    dicePerPlayer: 1,
    wildOnes: false,
    referee: false,
  }, { seed: 'one-die', now: 1 })
  state.players[0].dice = [1]
  state.players[1].dice = [1]
  assert.equal(applyBid(state, 'p1', 1, 1).ok, true)
  assert.equal(challenge(state, 'p2').ok, true)
  assert.equal(state.reveal.bidTrue, true)
  assert.equal(state.players[1].diceCount, 0)
  assert.equal(state.players[1].alive, false)
  const end = advanceRound(state)
  assert.equal(end.finished, true)
  assert.equal(end.winnerId, 'p1')
  assert.equal(state.phase, 'gameover')
  assert.equal(state.winnerId, 'p1')
  assert.equal(state.events.at(-1).type, 'match-end')
})

test('recordReferee writes once and only after a challenge', () => {
  const state = match('referee')
  assert.equal(recordReferee(state, '太早了', 'rule').ok, false)
  assert.equal(applyBid(state, 'p1', 1, 1).ok, true)
  assert.equal(challenge(state, 'p2').ok, true)
  const first = recordReferee(state, '这次开盅有点冒险。', 'rule', { now: 5 })
  assert.equal(first.ok, true)
  assert.equal(state.reveal.referee.text, '这次开盅有点冒险。')
  assert.equal(state.events.at(-1).type, 'referee')
  assert.equal(recordReferee(state, '第二次', 'llm').ok, false)
})

test('replay redacts the current round dice until a challenge', () => {
  const state = match('replay-redaction')
  const before = buildReplay(state)
  assert.equal(before.rounds[0].revealed, false)
  assert.equal(before.rounds[0].dice, null)
  assert.equal(before.match.totals.bids, 0)
  assert.equal(JSON.stringify(before).includes('"seed"'), false)

  assert.equal(applyBid(state, 'p1', 2, 2).ok, true)
  assert.equal(challenge(state, 'p2').ok, true)
  const after = buildReplay(state)
  assert.equal(after.rounds[0].revealed, true)
  assert.equal(after.rounds[0].dice.p1.length, 5)
  assert.equal(after.match.totals.bids, 1)
  assert.equal(after.match.totals.challenges, 1)
  assert.equal(after.rounds[0].events[0].type, 'bid')
  assert.equal(after.rounds[0].events[1].type, 'challenge')
})

test('the full replay keeps every bid and challenge in order', () => {
  const state = match('full-replay')
  assert.equal(applyBid(state, 'p1', 1, 1).ok, true)
  assert.equal(applyBid(state, 'p2', 2, 2).ok, true)
  assert.equal(applyBid(state, 'p1', 3, 3).ok, true)
  assert.equal(challenge(state, 'p2').ok, true)
  const replay = buildReplay(state)
  const types = replay.events.map((e) => e.type)
  assert.deepEqual(types, ['match-start', 'round-start', 'bid', 'bid', 'bid', 'challenge'])
  assert.equal(replay.rounds[0].events.length, 4)
  assert.equal(replay.match.totals.bids, 3)
})

test('public state carries totals, the bid note and at most three varied suggestions', () => {
  const state = match('suggestions', {
    players: [
      { name: '甲', kind: 'human' },
      { name: '乙', kind: 'human' },
      { name: '丙', kind: 'human' },
    ],
    dicePerPlayer: 5,
    wildOnes: true,
    referee: false,
  })
  assert.equal(applyBid(state, 'p1', 1, 2, { note: '先试一口', now: 3 }).ok, true)
  const pub = publicState(state)
  assert.equal(pub.currentBid.note, '先试一口')
  assert.equal(pub.totals.bids, 1)
  assert.equal(pub.totals.challenges, 0)
  assert.equal(pub.totals.rounds, 1)
  assert.ok(Array.isArray(pub.odds.suggestions))
  assert.ok(pub.odds.suggestions.length > 0)
  assert.ok(pub.odds.suggestions.length <= 3)
  const quantities = pub.odds.suggestions.map((s) => s.qty)
  assert.equal(new Set(quantities).size, quantities.length)
  for (const suggestion of pub.odds.suggestions) {
    assert.equal(isLegalBid(state, suggestion.qty, suggestion.face), true)
    assert.ok(suggestion.pTrue >= 0.45)
  }
  const sorted = pub.odds.suggestions.slice().sort((a, b) => a.qty - b.qty)
  assert.deepEqual(pub.odds.suggestions.map((s) => s.qty), sorted.map((s) => s.qty))
})

test('public events hide the current round dice but reveal past rounds', () => {
  const state = match('past-rounds')
  assert.equal(applyBid(state, 'p1', 1, 1).ok, true)
  assert.equal(challenge(state, 'p2').ok, true)
  assert.equal(advanceRound(state).ok, true)
  const pub = publicState(state)
  const starts = pub.events.filter((e) => e.type === 'round-start')
  assert.equal(starts.length, 2)
  assert.equal(starts[0].dice.p1.length, 5)
  assert.equal(starts[1].dice, undefined)
  const replay = buildReplay(state)
  assert.equal(replay.rounds[0].dice.p1.length, 5)
  assert.equal(replay.rounds[1].dice, null)
})

// Core rules for dsh-liars-dice.
//
// This module is deliberately free of I/O, timers, React and any DSH service.
// Everything the host half exposes is built from these functions, and every
// test drives them directly. That is what makes the replay log verifiable:
// a bid or a challenge is an event produced here, not a string assembled in
// the UI.
//
// Rules implemented (standard Liar's Dice / 吹牛骰子):
//   * every alive seat rolls `dicePerPlayer` hidden dice at the start of a round;
//   * on your turn you either raise the current bid or open the cup;
//   * a bid is (quantity, face); it must beat the previous bid, where a higher
//     quantity always beats a lower one and the same quantity only beats a
//     lower face;
//   * when the cup is opened every alive hand is revealed and the bid face is
//     counted. With `wildOnes` enabled a 1 counts for any face except a bid on
//     1s itself (a bid on 1s counts only real 1s);
//   * if the bid stands (actual >= quantity) the challenger loses one die,
//     otherwise the bidder does; a seat at zero dice is out;
//   * the seat that lost the die starts the next round;
//   * the last seat with dice wins.

import { bidProbability, countMatches, oddsForBid } from './odds.js'

export const RULES_VERSION = 1
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6
export const DEFAULT_DICE = 5
export const MIN_DICE = 1
export const MAX_DICE = 8
export const FACES = 6
export const MAX_NAME = 16
export const MAX_NOTE = 80

function nowMs(options) {
  return typeof options.now === 'number' ? options.now : Date.now()
}

function cleanText(value, max) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function seedNumber(seed) {
  // FNV-1a over the seed string. Called once per hand/round pair so the dice
  // for a round do not depend on how many times the state was read.
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
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

// Exported for tests and for nobody else: a hand is a pure function of the
// match seed, the round and the seat id.
export function rollHand(seed, round, playerId, count) {
  const rng = mulberry32(seedNumber(String(seed) + '|' + round + '|' + playerId))
  const dice = []
  for (let i = 0; i < count; i += 1) dice.push(1 + Math.floor(rng() * FACES))
  return dice
}

export function normalizePlayers(input) {
  if (!Array.isArray(input)) throw new Error('players 必须是数组')
  if (input.length < MIN_PLAYERS) throw new Error('至少需要 ' + MIN_PLAYERS + ' 位玩家')
  if (input.length > MAX_PLAYERS) throw new Error('最多支持 ' + MAX_PLAYERS + ' 位玩家')
  return input.map(function (entry, index) {
    const raw = entry && typeof entry === 'object' ? entry : {}
    const name = cleanText(raw.name, MAX_NAME) || '玩家' + (index + 1)
    const kind = raw.kind === 'agent' ? 'agent' : 'human'
    return { id: 'p' + (index + 1), name: name, kind: kind }
  })
}

export function normalizeConfig(input) {
  const raw = input && typeof input === 'object' ? input : {}
  const players = normalizePlayers(raw.players)
  const dicePerPlayer = Number.isInteger(raw.dicePerPlayer)
    ? Math.max(MIN_DICE, Math.min(MAX_DICE, raw.dicePerPlayer))
    : DEFAULT_DICE
  return {
    players: players,
    dicePerPlayer: dicePerPlayer,
    wildOnes: raw.wildOnes !== false,
    referee: raw.referee !== false,
  }
}

function pushEvent(state, event, now) {
  const entry = Object.assign({}, event, { seq: state.nextSeq, at: now })
  state.nextSeq += 1
  state.events.push(entry)
  return entry
}

function alivePlayers(state) {
  return state.players.filter(function (p) { return p.alive })
}

function findPlayer(state, playerId) {
  return state.players.find(function (p) { return p.id === playerId || p.name === playerId })
}

function nextAliveIndex(state, fromIndex) {
  for (let step = 1; step <= state.players.length; step += 1) {
    const index = (fromIndex + step) % state.players.length
    if (state.players[index] && state.players[index].alive) return index
  }
  return fromIndex
}

function assignRound(state) {
  for (const player of state.players) {
    player.dice = player.alive
      ? rollHand(state.seed, state.round, player.id, player.diceCount)
      : []
  }
}

export function totalDice(state) {
  return state.players.reduce(function (sum, p) {
    return sum + (p.alive ? p.diceCount : 0)
  }, 0)
}

export function createMatch(input, options) {
  const opts = options && typeof options === 'object' ? options : {}
  const config = normalizeConfig(input)
  const at = nowMs(opts)
  const seed = typeof opts.seed === 'string' && opts.seed.length > 0
    ? opts.seed
    : 'seed-' + at + '-' + Math.random().toString(36).slice(2)
  const state = {
    version: RULES_VERSION,
    phase: 'bidding',
    createdAt: at,
    updatedAt: at,
    seed: seed,
    round: 1,
    starterIndex: 0,
    turnIndex: 0,
    currentBid: null,
    reveal: null,
    winnerId: null,
    agentBusy: false,
    refereeBusy: false,
    nextSeq: 1,
    events: [],
    config: {
      dicePerPlayer: config.dicePerPlayer,
      wildOnes: config.wildOnes,
      referee: config.referee,
    },
    players: config.players.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        diceCount: config.dicePerPlayer,
        dice: [],
        alive: true,
        stats: { bids: 0, challenges: 0, diceLost: 0, bluffs: 0 },
      }
    }),
  }
  assignRound(state)
  pushEvent(state, {
    type: 'match-start',
    round: 1,
    players: state.players.map(function (p) { return { id: p.id, name: p.name, kind: p.kind } }),
    config: {
      dicePerPlayer: state.config.dicePerPlayer,
      wildOnes: state.config.wildOnes,
      referee: state.config.referee,
    },
  }, at)
  pushEvent(state, {
    type: 'round-start',
    round: 1,
    starterId: state.players[0].id,
    dice: handsOf(state),
  }, at)
  return state
}

function handsOf(state) {
  const hands = {}
  for (const p of state.players) hands[p.id] = p.dice.slice()
  return hands
}

export function activePlayer(state) {
  if (state.phase !== 'bidding') return undefined
  return state.players[state.turnIndex]
}

export function legalBidState(state) {
  const total = totalDice(state)
  const current = state.currentBid
  if (!current) {
    return { totalDice: total, current: null, minQty: 1, maxQty: total, next: { qty: 1, face: 1 } }
  }
  let nextQty = current.qty
  let nextFace = current.face + 1
  if (nextFace > FACES) {
    nextQty += 1
    nextFace = 1
  }
  const next = nextQty <= total ? { qty: nextQty, face: nextFace } : null
  return { totalDice: total, current: { qty: current.qty, face: current.face }, minQty: current.qty, maxQty: total, next: next }
}

export function isLegalBid(state, qty, face) {
  if (!Number.isInteger(qty) || !Number.isInteger(face)) return false
  if (qty < 1 || qty > totalDice(state)) return false
  if (face < 1 || face > FACES) return false
  const current = state.currentBid
  if (!current) return true
  if (qty > current.qty) return true
  return qty === current.qty && face > current.face
}

export function allLegalBids(state) {
  const total = totalDice(state)
  const bids = []
  for (let qty = 1; qty <= total; qty += 1) {
    for (let face = 1; face <= FACES; face += 1) {
      if (isLegalBid(state, qty, face)) bids.push({ qty: qty, face: face })
    }
  }
  return bids
}

function fail(error) {
  return { ok: false, error: error }
}

function touch(state, at) {
  state.updatedAt = at
}

export function applyBid(state, playerId, qty, face, options) {
  const opts = options && typeof options === 'object' ? options : {}
  if (state.phase !== 'bidding') return fail('当前不是叫价阶段')
  const player = findPlayer(state, playerId)
  if (!player || !player.alive) return fail('玩家不存在或已出局')
  if (activePlayer(state) !== player) return fail('还没轮到你')
  if (!isLegalBid(state, qty, face)) return fail('这一口必须大于当前叫价，且不能超过总骰数')
  const at = nowMs(opts)
  player.stats.bids += 1
  const note = cleanText(opts.note, MAX_NOTE)
  const via = opts.via === 'llm' || opts.via === 'rule' ? opts.via : 'human'
  const event = pushEvent(state, {
    type: 'bid',
    round: state.round,
    playerId: player.id,
    qty: qty,
    face: face,
    note: note || undefined,
    via: via,
  }, at)
  state.currentBid = {
    qty: qty,
    face: face,
    playerId: player.id,
    seq: event.seq,
    at: at,
    via: via,
    note: note || undefined,
  }
  state.turnIndex = nextAliveIndex(state, state.turnIndex)
  touch(state, at)
  return { ok: true, event: event }
}

export function challenge(state, playerId, options) {
  const opts = options && typeof options === 'object' ? options : {}
  if (state.phase !== 'bidding') return fail('当前不是叫价阶段')
  const player = findPlayer(state, playerId)
  if (!player || !player.alive) return fail('玩家不存在或已出局')
  if (activePlayer(state) !== player) return fail('还没轮到你')
  const bid = state.currentBid
  if (!bid) return fail('还没有人叫价，不能开盅')
  const bidder = findPlayer(state, bid.playerId)
  if (!bidder) return fail('叫价者不存在')

  const at = nowMs(opts)
  const hands = {}
  for (const p of alivePlayers(state)) hands[p.id] = p.dice.slice()
  // The odds recorded here are what the challenger could have computed from
  // their own hand before the cups came off. They are later used by the
  // referee and shown in replay; they are not a verdict.
  const odds = oddsForBid({
    hand: hands[player.id] || [],
    unknownDice: totalDice(state) - (hands[player.id] || []).length,
    qty: bid.qty,
    face: bid.face,
    wildOnes: state.config.wildOnes,
  })
  let actualAll = 0
  for (const id of Object.keys(hands)) {
    actualAll += countMatches(hands[id], bid.face, state.config.wildOnes)
  }
  const bidTrue = actualAll >= bid.qty
  const loser = bidTrue ? player : bidder
  player.stats.challenges += 1
  if (!bidTrue) bidder.stats.bluffs += 1
  loser.stats.diceLost += 1
  loser.diceCount = Math.max(0, loser.diceCount - 1)
  const eliminated = loser.diceCount === 0
  if (eliminated) loser.alive = false
  const alive = alivePlayers(state)
  const matchOver = alive.length <= 1

  const note = cleanText(opts.note, MAX_NOTE)
  const via = opts.via === 'llm' || opts.via === 'rule' ? opts.via : 'human'
  const event = pushEvent(state, {
    type: 'challenge',
    round: state.round,
    playerId: player.id,
    target: { qty: bid.qty, face: bid.face, bidderId: bidder.id, seq: bid.seq },
    actual: actualAll,
    bidTrue: bidTrue,
    loserId: loser.id,
    eliminated: eliminated,
    hands: hands,
    oddsAtChallenge: odds,
    note: note || undefined,
    via: via,
  }, at)

  state.reveal = {
    round: state.round,
    bidderId: bidder.id,
    challengerId: player.id,
    qty: bid.qty,
    face: bid.face,
    actual: actualAll,
    bidTrue: bidTrue,
    loserId: loser.id,
    eliminated: eliminated,
    matchOver: matchOver,
    hands: hands,
    oddsAtChallenge: odds,
    referee: null,
    at: at,
    seq: event.seq,
  }
  state.phase = 'reveal'
  state.turnIndex = state.players.findIndex(function (p) { return p.id === player.id })
  state.currentBid = bid
  touch(state, at)
  return { ok: true, event: event, reveal: state.reveal }
}

export function advanceRound(state, options) {
  const opts = options && typeof options === 'object' ? options : {}
  if (state.phase !== 'reveal') return fail('当前不在开盅结果阶段')
  const at = nowMs(opts)
  const alive = alivePlayers(state)
  if (alive.length <= 1) {
    const winner = alive[0] || state.players.find(function (p) { return p.diceCount > 0 })
    state.phase = 'gameover'
    state.winnerId = winner ? winner.id : null
    state.agentBusy = false
    state.refereeBusy = false
    pushEvent(state, {
      type: 'match-end',
      round: state.round,
      winnerId: state.winnerId,
    }, at)
    touch(state, at)
    return { ok: true, finished: true, winnerId: state.winnerId }
  }

  const loserId = state.reveal ? state.reveal.loserId : undefined
  const loserPlayer = loserId ? findPlayer(state, loserId) : undefined
  const loserIndex = loserPlayer ? state.players.indexOf(loserPlayer) : state.turnIndex
  const starterIndex = loserPlayer && loserPlayer.alive
    ? loserIndex
    : nextAliveIndex(state, loserIndex)

  state.round += 1
  state.starterIndex = starterIndex
  state.turnIndex = starterIndex
  state.currentBid = null
  state.reveal = null
  state.agentBusy = false
  state.refereeBusy = false
  assignRound(state)
  state.phase = 'bidding'
  pushEvent(state, {
    type: 'round-start',
    round: state.round,
    starterId: state.players[starterIndex].id,
    dice: handsOf(state),
  }, at)
  touch(state, at)
  return { ok: true, finished: false }
}

export function recordReferee(state, text, source, options) {
  const opts = options && typeof options === 'object' ? options : {}
  if (state.phase !== 'reveal' || !state.reveal) return fail('只有开盅后才能生成裁判点评')
  const clean = cleanText(text, 240)
  if (clean.length === 0) return fail('裁判点评为空')
  if (state.reveal.referee) return fail('这一局已经有点评了')
  const at = nowMs(opts)
  const entry = {
    text: clean,
    source: source === 'llm' ? 'llm' : 'rule',
    at: at,
  }
  state.reveal.referee = entry
  pushEvent(state, {
    type: 'referee',
    round: state.round,
    text: clean,
    source: entry.source,
  }, at)
  touch(state, at)
  return { ok: true, referee: entry }
}

function roundRevealed(state, round) {
  if (state.phase === 'gameover') return true
  if (state.reveal && state.reveal.round === round) return true
  return round < state.round
}

export function publicEvent(state, event) {
  if (!event || typeof event !== 'object') return event
  const out = Object.assign({}, event)
  if (event.type === 'round-start') {
    if (!roundRevealed(state, event.round)) delete out.dice
  }
  if (event.type === 'match-start') {
    delete out.seed
  }
  return out
}

export function publicState(state, options) {
  const opts = options && typeof options === 'object' ? options : {}
  const limit = Number.isInteger(opts.logLimit) ? opts.logLimit : 60
  const currentPlayer = activePlayer(state)
  const activeIsHuman = currentPlayer !== undefined && currentPlayer.kind === 'human'
  const bid = state.currentBid
  const bidder = bid ? findPlayer(state, bid.playerId) : undefined
  const reveal = state.reveal
  let odds = null
  if (state.phase === 'bidding' && currentPlayer && activeIsHuman) {
    const unknown = totalDice(state) - currentPlayer.dice.length
    if (bid) {
      odds = oddsForBid({
        hand: currentPlayer.dice,
        unknownDice: unknown,
        qty: bid.qty,
        face: bid.face,
        wildOnes: state.config.wildOnes,
      })
    } else {
      odds = {
        opening: true,
        totalDice: totalDice(state),
        handSize: currentPlayer.dice.length,
        unknownDice: unknown,
        faces: countFaceOptions(currentPlayer.dice, state.config.wildOnes),
      }
    }
    const ranked = allLegalBids(state).map(function (candidate) {
      return {
        qty: candidate.qty,
        face: candidate.face,
        pTrue: bidProbability(currentPlayer.dice, unknown, candidate.qty, candidate.face, state.config.wildOnes),
      }
    }).filter(function (candidate) {
      return candidate.pTrue >= 0.45
    }).sort(function (a, b) {
      const scoreA = a.qty * a.pTrue
      const scoreB = b.qty * b.pTrue
      if (scoreB !== scoreA) return scoreB - scoreA
      if (b.pTrue !== a.pTrue) return b.pTrue - a.pTrue
      return a.face - b.face
    })
    // One suggestion per quantity so the three chips are actually different
    // decisions instead of the same "1 个 X" repeated six ways.
    const picked = []
    const seenQty = new Set()
    for (const candidate of ranked) {
      if (seenQty.has(candidate.qty)) continue
      seenQty.add(candidate.qty)
      picked.push(candidate)
      if (picked.length === 3) break
    }
    for (const candidate of ranked) {
      if (picked.length >= 3) break
      if (picked.indexOf(candidate) < 0) picked.push(candidate)
    }
    picked.sort(function (a, b) {
      if (a.qty !== b.qty) return a.qty - b.qty
      return b.pTrue - a.pTrue
    })
    odds.suggestions = picked
  }
  return {
    version: state.version,
    phase: state.phase,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    round: state.round,
    totalDice: totalDice(state),
    config: {
      dicePerPlayer: state.config.dicePerPlayer,
      wildOnes: state.config.wildOnes,
      referee: state.config.referee,
    },
    players: state.players.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        diceCount: p.diceCount,
        alive: p.alive,
        isTurn: state.phase === 'bidding' && state.players[state.turnIndex] === p,
        isBidder: bid ? bid.playerId === p.id : false,
        stats: Object.assign({}, p.stats),
      }
    }),
    turnId: state.phase === 'bidding' && currentPlayer ? currentPlayer.id : null,
    starterId: state.players[state.starterIndex] ? state.players[state.starterIndex].id : null,
    currentBid: bid ? {
      qty: bid.qty,
      face: bid.face,
      playerId: bid.playerId,
      playerName: bidder ? bidder.name : '?',
      seq: bid.seq,
      at: bid.at,
      via: bid.via,
      note: bid.note,
    } : null,
    activeHand: state.phase === 'bidding' && activeIsHuman ? currentPlayer.dice.slice() : null,
    activePlayerId: currentPlayer ? currentPlayer.id : null,
    legal: legalBidState(state),
    odds: odds,
    reveal: reveal ? {
      round: reveal.round,
      bidderId: reveal.bidderId,
      challengerId: reveal.challengerId,
      qty: reveal.qty,
      face: reveal.face,
      actual: reveal.actual,
      bidTrue: reveal.bidTrue,
      loserId: reveal.loserId,
      eliminated: reveal.eliminated,
      matchOver: reveal.matchOver,
      hands: reveal.hands,
      oddsAtChallenge: reveal.oddsAtChallenge,
      referee: reveal.referee,
      seq: reveal.seq,
      at: reveal.at,
    } : null,
    winnerId: state.winnerId,
    matchOver: state.phase === 'gameover',
    agentBusy: state.agentBusy === true,
    refereeBusy: state.refereeBusy === true,
    totals: matchTotals(state),
    events: state.events.slice(-limit).map(function (event) { return publicEvent(state, event) }),
    serverTime: Date.now(),
  }
}

function countFaceOptions(hand, wildOnes) {
  const faces = []
  for (let face = 1; face <= FACES; face += 1) {
    faces.push({
      face: face,
      known: countMatches(hand, face, wildOnes),
    })
  }
  return faces
}

function matchTotals(state) {
  let bids = 0
  let challenges = 0
  let referees = 0
  for (const event of state.events) {
    if (event.type === 'bid') bids += 1
    else if (event.type === 'challenge') challenges += 1
    else if (event.type === 'referee') referees += 1
  }
  return { bids: bids, challenges: challenges, referees: referees, rounds: state.round }
}

export function buildReplay(state) {
  const events = state.events.map(function (event) { return publicEvent(state, event) })
  const rounds = []
  for (let round = 1; round <= state.round; round += 1) {
    const roundEvents = events.filter(function (event) {
      return event && event.round === round && event.type !== 'match-start' && event.type !== 'round-start'
    })
    const start = state.events.find(function (event) {
      return event.type === 'round-start' && event.round === round
    })
    const challengeEvent = roundEvents.filter(function (event) { return event.type === 'challenge' }).pop()
    const revealed = roundRevealed(state, round)
    rounds.push({
      round: round,
      starterId: start ? start.starterId : null,
      complete: Boolean(challengeEvent),
      revealed: revealed,
      dice: revealed && start ? start.dice : null,
      events: roundEvents,
      challenge: challengeEvent || null,
      loserId: challengeEvent ? challengeEvent.loserId : null,
      eliminatedId: challengeEvent && challengeEvent.eliminated ? challengeEvent.loserId : null,
    })
  }
  const totals = matchTotals(state)
  return {
    match: {
      version: state.version,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      phase: state.phase,
      round: state.round,
      winnerId: state.winnerId,
      players: state.players.map(function (p) {
        return {
          id: p.id,
          name: p.name,
          kind: p.kind,
          alive: p.alive,
          diceCount: p.diceCount,
          stats: Object.assign({}, p.stats),
        }
      }),
      config: {
        dicePerPlayer: state.config.dicePerPlayer,
        wildOnes: state.config.wildOnes,
        referee: state.config.referee,
      },
      totals: {
        bids: totals.bids,
        challenges: totals.challenges,
        referees: totals.referees,
        rounds: totals.rounds,
      },
    },
    rounds: rounds,
    events: events,
  }
}

export function configFromMatch(state) {
  return {
    players: state.players.map(function (p) { return { name: p.name, kind: p.kind } }),
    dicePerPlayer: state.config.dicePerPlayer,
    wildOnes: state.config.wildOnes,
    referee: state.config.referee,
  }
}

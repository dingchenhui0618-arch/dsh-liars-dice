// Exact probability helpers for 吹牛骰子 / Liar's Dice.
//
// Everything here is conditional on information a player legally has: their own
// hand, the number of dice still hidden from opponents, and the current bid.
// It deliberately does not model whether the opponent is bluffing; the panel
// says so in the UI. That keeps the number honest and keeps the module small
// enough to test exhaustively.

export const FACES = 6

export function countMatches(dice, face, wildOnes) {
  if (!Array.isArray(dice) || !Number.isInteger(face)) return 0
  let count = 0
  for (const value of dice) {
    if (value === face) count += 1
    else if (wildOnes && face !== 1 && value === 1) count += 1
  }
  return count
}

// P(X = k) for X ~ Binomial(n, p). Uses the pmf recurrence so n up to 48
// stays exact enough for a UI and never overflows a combination.
export function binomialPmf(n, p, k) {
  if (!Number.isInteger(n) || n < 0) return 0
  if (!Number.isInteger(k) || k < 0 || k > n) return 0
  if (p <= 0) return k === 0 ? 1 : 0
  if (p >= 1) return k === n ? 1 : 0
  let value = Math.pow(1 - p, n)
  for (let i = 0; i < k; i += 1) {
    value *= ((n - i) / (i + 1)) * (p / (1 - p))
  }
  return Math.min(1, Math.max(0, value))
}

export function binomialAtLeast(n, p, k) {
  if (!Number.isInteger(n) || n < 0) return 0
  if (!Number.isInteger(k) || k <= 0) return 1
  if (k > n) return 0
  let sum = 0
  for (let i = k; i <= n; i += 1) sum += binomialPmf(n, p, i)
  return Math.min(1, Math.max(0, sum))
}

export function matchProbability(face, wildOnes) {
  if (wildOnes && face !== 1) return 2 / FACES
  return 1 / FACES
}

export function faceOptions(hand, wildOnes) {
  const options = []
  for (let face = 1; face <= FACES; face += 1) {
    options.push({
      face: face,
      known: countMatches(hand, face, wildOnes),
      matchProbability: matchProbability(face, wildOnes),
    })
  }
  return options
}

// Odds that a specific bid is true, from the perspective of a player holding
// `hand` while `unknownDice` dice are hidden from them.
//
//   P(actual >= qty) = P(Binomial(unknownDice, p) >= qty - known)
//
// For a bid on 1s with wild ones enabled, only real 1s count, so p = 1/6.
export function oddsForBid(input) {
  const opts = input && typeof input === 'object' ? input : {}
  const hand = Array.isArray(opts.hand) ? opts.hand : []
  const face = Number.isInteger(opts.face) ? opts.face : 1
  const qty = Number.isInteger(opts.qty) ? opts.qty : 1
  const wildOnes = opts.wildOnes === true
  const unknownDice = Number.isInteger(opts.unknownDice) && opts.unknownDice > 0 ? opts.unknownDice : 0
  const known = countMatches(hand, face, wildOnes)
  const p = matchProbability(face, wildOnes)
  const need = Math.max(0, qty - known)
  const pTrue = need === 0 ? 1 : (need > unknownDice ? 0 : binomialAtLeast(unknownDice, p, need))
  const distribution = []
  for (let k = 0; k <= unknownDice; k += 1) {
    distribution.push({
      total: known + k,
      hidden: k,
      p: binomialPmf(unknownDice, p, k),
    })
  }
  return {
    face: face,
    qty: qty,
    known: known,
    handSize: hand.length,
    unknownDice: unknownDice,
    matchProbability: p,
    need: need,
    expectedTotal: known + unknownDice * p,
    pTrue: pTrue,
    pFalse: 1 - pTrue,
    challengeWin: 1 - pTrue,
    distribution: distribution,
  }
}

// The probability that a proposed future bid would be true, used by the bot
// and by the client's "next bid" suggestions.
export function bidProbability(hand, unknownDice, qty, face, wildOnes) {
  return oddsForBid({ hand: hand, unknownDice: unknownDice, qty: qty, face: face, wildOnes: wildOnes }).pTrue
}

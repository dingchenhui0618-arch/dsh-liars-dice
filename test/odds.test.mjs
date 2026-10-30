import { strict as assert } from 'node:assert'
import test from 'node:test'
import {
  binomialAtLeast,
  binomialPmf,
  bidProbability,
  countMatches,
  faceOptions,
  matchProbability,
  oddsForBid,
} from '../src/odds.js'

test('wild ones match every non-1 face, but a bid on 1s only counts real 1s', () => {
  const hand = [1, 1, 4, 2, 6]
  assert.equal(countMatches(hand, 4, true), 3)
  assert.equal(countMatches(hand, 1, true), 2)
  assert.equal(countMatches(hand, 4, false), 1)
  assert.equal(matchProbability(4, true), 2 / 6)
  assert.equal(matchProbability(1, true), 1 / 6)
  assert.equal(matchProbability(4, false), 1 / 6)
})

test('binomial pmf and tail match hand-computed values', () => {
  const p = 1 / 6
  assert.ok(Math.abs(binomialPmf(2, p, 0) - 25 / 36) < 1e-12)
  assert.ok(Math.abs(binomialPmf(2, p, 1) - 10 / 36) < 1e-12)
  assert.ok(Math.abs(binomialPmf(2, p, 2) - 1 / 36) < 1e-12)
  assert.ok(Math.abs(binomialAtLeast(2, p, 1) - 11 / 36) < 1e-12)
  assert.equal(binomialAtLeast(2, p, 0), 1)
  assert.equal(binomialAtLeast(2, p, 3), 0)
})

test('with no hidden dice the bid is certain or impossible', () => {
  const yes = oddsForBid({ hand: [4, 4], unknownDice: 0, qty: 2, face: 4, wildOnes: false })
  assert.equal(yes.pTrue, 1)
  assert.equal(yes.pFalse, 0)
  const no = oddsForBid({ hand: [4, 4], unknownDice: 0, qty: 3, face: 4, wildOnes: false })
  assert.equal(no.pTrue, 0)
  assert.equal(no.challengeWin, 1)
  assert.equal(no.distribution.length, 1)
})

test('wild ones raise the per-die match probability to one third', () => {
  const odds = oddsForBid({ hand: [1, 4], unknownDice: 2, qty: 2, face: 4, wildOnes: true })
  assert.equal(odds.known, 2)
  assert.equal(odds.pTrue, 1)
  assert.ok(Math.abs(odds.expectedTotal - (2 + 2 / 3)) < 1e-12)
  assert.equal(odds.distribution.length, 3)
  assert.ok(Math.abs(odds.distribution.reduce((sum, row) => sum + row.p, 0) - 1) < 1e-12)
})

test('a bid on 1s with wild ones uses one sixth per hidden die', () => {
  const odds = oddsForBid({ hand: [1, 4], unknownDice: 2, qty: 1, face: 1, wildOnes: true })
  assert.equal(odds.known, 1)
  assert.ok(Math.abs(odds.pTrue - 1) < 1e-12)
  const harder = oddsForBid({ hand: [1, 4], unknownDice: 2, qty: 2, face: 1, wildOnes: true })
  assert.ok(Math.abs(harder.pTrue - 11 / 36) < 1e-12)
  assert.ok(Math.abs(harder.challengeWin - 25 / 36) < 1e-12)
})

test('the distribution is a valid pmf and the expected value is linear', () => {
  for (const wildOnes of [false, true]) {
    const odds = oddsForBid({ hand: [2, 3, 5], unknownDice: 10, qty: 3, face: 2, wildOnes })
    const sum = odds.distribution.reduce((total, row) => total + row.p, 0)
    assert.ok(Math.abs(sum - 1) < 1e-9)
    const expected = odds.distribution.reduce((total, row) => total + row.total * row.p, 0)
    assert.ok(Math.abs(expected - odds.expectedTotal) < 1e-9)
  }
})

test('face options expose the known count and per-die probability', () => {
  const options = faceOptions([1, 2, 2, 6], true)
  assert.equal(options.length, 6)
  assert.equal(options[0].face, 1)
  assert.equal(options[1].known, 3)
  assert.equal(options[1].matchProbability, 1 / 3)
})

test('bidProbability agrees with oddsForBid', () => {
  const hand = [3, 3, 1]
  for (const wildOnes of [false, true]) {
    for (const face of [1, 3, 6]) {
      for (const qty of [1, 2, 4]) {
        const odds = oddsForBid({ hand, unknownDice: 5, qty, face, wildOnes })
        assert.equal(bidProbability(hand, 5, qty, face, wildOnes), odds.pTrue)
      }
    }
  }
})

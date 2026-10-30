// Client half of dsh-liars-dice: the 吹牛骰子 Tab in the conversation view.
//
// Must stay CommonJS — the build wraps this in window.__ModuleLoader__.load()
// and React is supplied by the harness (esbuild marks it external).

const React = require('react')
const h = React.createElement
const CSS = require('./client-css.cjs')

const API = '/dsh-liars-dice'
const POLL_MS = 900
const TABLE_KEY = 'dsh-liars-dice.table'
const ODDS_KEY = 'dsh-liars-dice.odds'

const DEFAULT_SETUP = {
  players: [
    { name: '你', kind: 'human' },
    { name: '阿骰', kind: 'agent' },
  ],
  dicePerPlayer: 5,
  wildOnes: true,
  referee: true,
}

// ---------------------------------------------------------------------------
// shared poll: one module-level source of truth for every mounted panel
// ---------------------------------------------------------------------------

let snap = { data: null, error: '', at: 0 }
const listeners = new Set()
let timer = null
let inFlight = false

function emit() {
  Array.from(listeners).forEach(function (fn) {
    try {
      fn(snap)
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[dsh-liars-dice] listener failed', error)
    }
  })
}

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : value
  } catch (error) {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    // storage is a convenience, not a requirement
  }
}

function tableId() {
  let id = readStorage(TABLE_KEY, '')
  if (id && /^[a-zA-Z0-9_-]{1,64}$/.test(id)) return id
  id = 't-' + Math.random().toString(36).slice(2, 10)
  writeStorage(TABLE_KEY, id)
  return id
}

function load() {
  if (inFlight) return
  if (typeof document !== 'undefined' && document.hidden) return
  inFlight = true
  fetch(API + '/state?table=' + encodeURIComponent(tableId()), {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
    .then(function (res) { return res.json() })
    .then(function (data) {
      if (data && data.ok) {
        snap = { data: data, error: '', at: Date.now() }
      } else {
        snap = { data: snap.data, error: (data && data.error) || '读取对局失败', at: Date.now() }
      }
    })
    .catch(function (error) {
      snap = { data: snap.data, error: String((error && error.message) || error), at: Date.now() }
    })
    .finally(function () {
      inFlight = false
      emit()
    })
}

function post(method, body) {
  const payload = Object.assign({ table: tableId() }, body || {})
  return fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(function (res) { return res.json() })
    .then(function (data) {
      if (!data || !data.ok) {
        const message = (data && data.error) || '操作失败'
        throw new Error(message)
      }
      const merged = Object.assign({}, snap.data || {}, data)
      if (data.defaults === undefined && merged.defaults === undefined) merged.defaults = DEFAULT_SETUP
      snap = { data: merged, error: '', at: Date.now() }
      emit()
      load()
      return data
    })
    .catch(function (error) {
      snap = { data: snap.data, error: String((error && error.message) || error), at: Date.now() }
      emit()
      throw error
    })
}

function fetchReplay() {
  return fetch(API + '/replay?table=' + encodeURIComponent(tableId()), {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
    .then(function (res) { return res.json() })
    .then(function (data) {
      if (!data || !data.ok) throw new Error((data && data.error) || '读取复盘失败')
      return data.replay
    })
}

function subscribe(fn) {
  listeners.add(fn)
  if (timer === null) {
    load()
    timer = setInterval(load, POLL_MS)
  }
  fn(snap)
  return function () {
    listeners.delete(fn)
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function playerById(table, id) {
  if (!table || !Array.isArray(table.players)) return undefined
  return table.players.find(function (p) { return p.id === id })
}

function playerName(table, id) {
  const player = playerById(table, id)
  return player ? player.name : '?'
}

function fmtTime(ms) {
  if (!ms) return ''
  try {
    return new Date(ms).toLocaleTimeString('zh-CN', { hour12: false })
  } catch (error) {
    return ''
  }
}

function pct(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.round(Math.max(0, Math.min(1, value)) * 100)
}

function trimName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 16)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function setupFrom(defaults) {
  const base = defaults && defaults.players ? defaults : DEFAULT_SETUP
  const copy = clone(base)
  if (!Array.isArray(copy.players) || copy.players.length < 2) copy.players = clone(DEFAULT_SETUP.players)
  return copy
}

function isLegalDraft(table, qty, face) {
  if (!table || !Number.isInteger(qty) || !Number.isInteger(face)) return false
  if (qty < 1 || qty > table.totalDice) return false
  if (face < 1 || face > 6) return false
  const bid = table.currentBid
  if (!bid) return true
  return qty > bid.qty || (qty === bid.qty && face > bid.face)
}

function configOf(table) {
  return {
    players: table.players.map(function (p) { return { name: p.name, kind: p.kind } }),
    dicePerPlayer: table.config.dicePerPlayer,
    wildOnes: table.config.wildOnes,
    referee: table.config.referee,
  }
}

function eventLabel(table, event) {
  if (!event) return ''
  if (event.type === 'match-start') return '对局开始 · ' + event.players.length + ' 位玩家'
  if (event.type === 'round-start') return '第 ' + event.round + ' 回合开始 · ' + playerName(table, event.starterId) + ' 先叫'
  if (event.type === 'bid') return playerName(table, event.playerId) + ' 叫 ' + event.qty + ' 个 ' + event.face
  if (event.type === 'challenge') {
    return playerName(table, event.playerId) + ' 开盅 · 实际 ' + event.actual + ' 个 ' + event.target.face +
      ' · ' + (event.bidTrue ? '叫价成立' : '叫价不成立') +
      ' · ' + playerName(table, event.loserId) + ' 输一颗'
  }
  if (event.type === 'referee') return '裁判 · ' + event.text
  if (event.type === 'match-end') return '对局结束 · ' + playerName(table, event.winnerId) + ' 获胜'
  return event.type
}

// ---------------------------------------------------------------------------
// atoms
// ---------------------------------------------------------------------------

const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Dice(props) {
  const value = Number(props.value) || 1
  const size = props.size || 36
  const back = props.back === true
  const on = PIPS[value] || PIPS[1]
  const style = { '--die-size': size + 'px' }
  const cls = 'ld-die' + (back ? ' back' : '') + (value === 1 && !back ? ' one' : '') +
    (props.glow ? ' glow' : '') + (props.className ? ' ' + props.className : '')
  return h('div', {
    className: cls,
    style: style,
    role: 'img',
    'aria-label': back ? '暗扣的骰子' : value + ' 点',
  },
    back ? null : h('div', { className: 'ld-pips' }, Array.from({ length: 9 }).map(function (_, index) {
      return h('i', { key: index, className: on.indexOf(index) >= 0 ? 'on' : '' })
    })),
  )
}

function Switch(props) {
  return h('label', { className: 'ld-switch' },
    h('input', {
      type: 'checkbox',
      checked: props.checked === true,
      onChange: function (event) { props.onChange(event.target.checked) },
      'aria-label': props.label,
    }),
    h('span', { className: 'ld-track' }, h('span', { className: 'ld-thumb' })),
    h('span', null, props.label),
  )
}

function Seat(props) {
  const p = props.player
  const table = props.table
  const active = props.active === true
  const bidder = p.isBidder === true
  let status = '等待'
  if (!p.alive) status = '已出局'
  else if (table.phase === 'reveal' && table.reveal && table.reveal.loserId === p.id) status = '本回合输一颗'
  else if (active && p.kind === 'agent' && table.agentBusy) status = '思考中…'
  else if (active) status = '叫价中'
  else if (bidder) status = '当前叫价'
  const initial = String(p.name || '?').trim().slice(0, 1) || '?'
  return h('div', {
    className: 'ld-seat' + (active ? ' active' : '') + (!p.alive ? ' out' : ''),
    title: p.name + ' · 叫价 ' + p.stats.bids + ' 次 · 开盅 ' + p.stats.challenges + ' 次 · 输 ' + p.stats.diceLost + ' 颗',
  },
    h('div', { className: 'ld-avatar' + (p.kind === 'agent' ? ' agent' : '') },
      initial,
      p.kind === 'agent' ? h('span', { className: 'ld-agent-dot' }) : null,
    ),
    h('div', { className: 'ld-seat-body' },
      h('div', { className: 'ld-seat-top' },
        h('span', { className: 'ld-seat-name' }, p.name),
        p.kind === 'agent' ? h('span', { className: 'ld-tag agent' }, 'Agent') : null,
        bidder ? h('span', { className: 'ld-tag' }, '叫价') : null,
      ),
      h('div', { className: 'ld-seat-meta' },
        h('span', null, p.diceCount + ' 颗'),
        h('span', { className: 'dot' }),
        h('span', null, '叫 ' + p.stats.bids + ' / 开 ' + p.stats.challenges),
      ),
      h('div', { className: 'ld-seat-status' + (active && p.kind === 'agent' && table.agentBusy ? ' thinking' : '') }, status),
    ),
  )
}

function BidDisplay(props) {
  const table = props.table
  const bid = table.currentBid
  const turn = playerById(table, table.turnId)
  const reveal = table.reveal
  let turnText = null
  if (table.phase === 'reveal') {
    turnText = h('div', { className: 'ld-turn' }, reveal && reveal.bidTrue ? '叫价成立，开盅方输一颗' : '叫价不成立，叫价方输一颗')
  } else if (table.phase === 'gameover') {
    turnText = h('div', { className: 'ld-turn' }, '对局结束')
  } else if (turn) {
    const label = turn.kind === 'agent'
      ? (table.agentBusy ? turn.name + ' 正在想这一口…' : '轮到 ' + turn.name + '（Agent）')
      : '轮到你 · ' + (bid ? '抬价或开盅' : '先开个价')
    turnText = h('div', { className: 'ld-turn' }, h('span', { className: 'ld-pulse' }), h('span', null, label))
  }
  return h('div', { className: 'ld-felt' },
    h('div', { className: 'ld-round-tag' }, '第 ' + table.round + ' 回合 · 共 ' + table.totalDice + ' 颗'),
    bid
      ? h('div', { className: 'ld-felt-bid' },
        h('span', { className: 'ld-bid-num' }, String(bid.qty)),
        h('span', { className: 'ld-bid-unit' }, '个'),
        h(Dice, { value: bid.face, size: 46, glow: true }),
        h('div', { className: 'ld-bid-meta' },
          h('div', { className: 'ld-bid-by' }, bid.playerName + (bid.via === 'llm' ? ' · Agent' : '')),
          bid.note ? h('div', { className: 'ld-bid-note' }, '“' + bid.note + '”') : null,
        ),
      )
      : h('div', { className: 'ld-empty-bid' },
        h('b', null, '桌上还没有叫价'),
        h('span', null, '第一个开口的人定下这一回合的调子。'),
      ),
    turnText,
    props.canChallenge
      ? h('button', {
        className: 'ld-btn danger ld-challenge',
        type: 'button',
        disabled: props.busy,
        onClick: props.onChallenge,
      }, '开盅 · 我不信')
      : null,
  )
}

// ---------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------

function SetupView(props) {
  const initial = setupFrom(props.defaults)
  const [players, setPlayers] = React.useState(initial.players)
  const [dicePerPlayer, setDicePerPlayer] = React.useState(initial.dicePerPlayer || 5)
  const [wildOnes, setWildOnes] = React.useState(initial.wildOnes !== false)
  const [referee, setReferee] = React.useState(initial.referee !== false)
  const [error, setError] = React.useState('')
  const busy = props.busy === 'new'

  function updatePlayer(index, patch) {
    setPlayers(function (current) {
      return current.map(function (p, i) { return i === index ? Object.assign({}, p, patch) : p })
    })
  }

  function addPlayer() {
    setPlayers(function (current) {
      if (current.length >= 6) return current
      return current.concat([{ name: '玩家' + (current.length + 1), kind: 'human' }])
    })
  }

  function removePlayer(index) {
    setPlayers(function (current) {
      if (current.length <= 2) return current
      return current.filter(function (_, i) { return i !== index })
    })
  }

  function start() {
    const clean = players.map(function (p, i) {
      return {
        name: trimName(p.name) || '玩家' + (i + 1),
        kind: p.kind === 'agent' ? 'agent' : 'human',
      }
    })
    if (clean.length < 2) {
      setError('至少需要两位玩家。')
      return
    }
    setError('')
    props.onStart({
      players: clean,
      dicePerPlayer: dicePerPlayer,
      wildOnes: wildOnes,
      referee: referee,
    })
  }

  const llmOk = props.llm && props.llm.available === true
  return h('div', { className: 'ld-setup' },
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
      h('section', { className: 'ld-card ld-hero' },
        h('div', { className: 'ld-hero-inner' },
          h('div', { className: 'ld-hero-copy' },
            h('div', { className: 'ld-kicker' }, 'Liar’s Dice · 本地热座'),
            h('h2', null, '一张桌子，几颗骰子，', h('br'), '和一句', h('em', null, '“我不信”'), '。'),
            h('p', { className: 'ld-lead' }, '轮流叫价，可以抬，可以诈，也可以掀开对手的杯子。Agent 可以坐进牌桌当对手，也可以在开盅后做裁判；每一次叫价和开盅都会留下可回放的记录。'),
          ),
          h('div', { className: 'ld-hero-dice', 'aria-hidden': 'true' },
            h(Dice, { value: 5, size: 34 }),
            h(Dice, { value: 3, size: 34 }),
            h(Dice, { value: 6, size: 34 }),
          ),
        ),
      ),
      h('section', { className: 'ld-card' },
        h('div', { className: 'ld-section-title' }, h('h3', null, '这桌坐谁'), h('span', null, '2–6 人 · 热座轮流')),
        h('div', { className: 'ld-seat-list' }, players.map(function (p, index) {
          return h('div', { className: 'ld-seat-row', key: index },
            h('div', { className: 'ld-seat-index' }, String(index + 1)),
            h('input', {
              className: 'ld-input',
              value: p.name,
              maxLength: 16,
              placeholder: '玩家名',
              'aria-label': '第 ' + (index + 1) + ' 位玩家名',
              onChange: function (event) { updatePlayer(index, { name: event.target.value }) },
            }),
            h('div', { className: 'ld-kind-toggle', role: 'group', 'aria-label': '玩家类型' },
              h('button', {
                type: 'button',
                'aria-pressed': p.kind !== 'agent',
                onClick: function () { updatePlayer(index, { kind: 'human' }) },
              }, '真人'),
              h('button', {
                type: 'button',
                'aria-pressed': p.kind === 'agent',
                onClick: function () { updatePlayer(index, { kind: 'agent' }) },
              }, 'Agent'),
            ),
            h('button', {
              className: 'ld-icon-btn',
              type: 'button',
              title: '移除这个座位',
              'aria-label': '移除第 ' + (index + 1) + ' 位玩家',
              disabled: players.length <= 2,
              onClick: function () { removePlayer(index) },
            }, '×'),
          )
        })),
        h('div', { className: 'ld-seat-actions' },
          h('button', { className: 'ld-btn', type: 'button', onClick: addPlayer, disabled: players.length >= 6 }, '+ 加一个座位'),
          h('span', { className: 'ld-start-note' }, 'Agent 座位会自动叫价；真人座位在同一块屏幕上轮流操作。'),
        ),
        h('div', { className: 'ld-options' },
          h('div', { className: 'ld-option' },
            h('div', { className: 'ld-option-label' }, '每人骰子'),
            h('div', { className: 'ld-option-value' },
              h('div', { className: 'ld-mini-seg' }, [3, 5, 7].map(function (n) {
                return h('button', {
                  key: n,
                  type: 'button',
                  'aria-pressed': dicePerPlayer === n,
                  onClick: function () { setDicePerPlayer(n) },
                }, n + ' 颗')
              })),
            ),
          ),
          h('div', { className: 'ld-option' },
            h('div', { className: 'ld-option-label' }, '万能 1'),
            h('div', { className: 'ld-option-value' },
              h('span', { style: { color: 'var(--ld-muted)', fontSize: '11px' } }, wildOnes ? '1 可当任意非 1 点' : '1 只算 1'),
              h(Switch, { checked: wildOnes, onChange: setWildOnes, label: '开启' }),
            ),
          ),
          h('div', { className: 'ld-option' },
            h('div', { className: 'ld-option-label' }, '裁判点评'),
            h('div', { className: 'ld-option-value' },
              h('span', { style: { color: 'var(--ld-muted)', fontSize: '11px' } }, referee ? '开盅后复盘' : '关闭'),
              h(Switch, { checked: referee, onChange: setReferee, label: '开启' }),
            ),
          ),
        ),
        error ? h('div', { className: 'ld-error', style: { marginTop: '12px' } }, error) : null,
        h('div', { className: 'ld-start-row' },
          h('button', { className: 'ld-btn primary', type: 'button', onClick: start, disabled: busy }, busy ? '正在开桌…' : '开桌 · 先摇骰子'),
          h('span', { className: 'ld-start-note' }, llmOk ? 'Agent 对手会调用当前模型，失败时自动退回内置概率策略。' : '没有可用模型：Agent 对手与裁判会使用内置规则策略。'),
        ),
      ),
    ),
    h('aside', { className: 'ld-card ld-rules' },
      h('div', { className: 'ld-section-title' }, h('h3', null, '怎么玩'), h('span', null, '30 秒上手')),
      h('div', { className: 'ld-rule-step' },
        h('div', { className: 'ld-rule-num' }, '1'),
        h('div', null, h('b', null, '只看自己的骰子'), h('span', null, '每回合每人摇同样数量的骰子，扣在杯子里。')),
      ),
      h('div', { className: 'ld-rule-step' },
        h('div', { className: 'ld-rule-num' }, '2'),
        h('div', null, h('b', null, '叫数量 + 点数'), h('span', null, '后一口必须更大：数量更大，或数量相同、点数更大。')),
      ),
      h('div', { className: 'ld-rule-step' },
        h('div', { className: 'ld-rule-num' }, '3'),
        h('div', null, h('b', null, '不信就开盅'), h('span', null, '数全场该点数。叫价成立，开盅者输一颗；不成立，叫价者输一颗。')),
      ),
      h('div', { className: 'ld-rule-step' },
        h('div', { className: 'ld-rule-num' }, '4'),
        h('div', null, h('b', null, '活到最后'), h('span', null, '骰子归零出局；输骰的人下一回合先叫。')),
      ),
      h('div', { className: 'ld-note' },
        '概率面板只按你的手骰和未知骰计算，不推断对手是否在诈唬。开盅记录、叫价和裁判点评都会写进复盘。',
      ),
    ),
  )
}

// ---------------------------------------------------------------------------
// game
// ---------------------------------------------------------------------------

function OddsCard(props) {
  const table = props.table
  const reveal = table.reveal
  if (reveal) {
    const odds = reveal.oddsAtChallenge
    return h('section', { className: 'ld-side-card' },
      h('div', { className: 'ld-side-head' }, h('h4', null, '概率结算'), h('span', null, '开盅前视角')),
      h('div', { className: 'ld-odds-hero' },
        h('b', null, odds ? pct(odds.challengeWin) + '%' : '—'),
        h('span', null, '开盅方当时胜率'),
      ),
      h('div', { className: 'ld-odds-sub' }, odds
        ? '叫价成立概率 ' + pct(odds.pTrue) + '% · 实际 ' + reveal.actual + ' 个 ' + reveal.face
        : '这一局没有记录到概率'),
      h('div', { className: 'ld-foot' }, '这是开盅者按自己的手骰和未知骰能算出的数字，不是对错判决。'),
    )
  }
  const odds = table.odds
  const noRaise = !table.legal || table.legal.next === null
  const turn = playerById(table, table.turnId)
  if (!props.peek && turn && turn.kind === 'human') {
    return h('section', { className: 'ld-side-card' },
      h('div', { className: 'ld-side-head' }, h('h4', null, '概率面板'), h('span', null, '已遮住')),
      h('div', { className: 'ld-empty' },
        h('b', null, '先翻开手骰'),
        h('span', null, '热座对局里，赔率要等你看到自己的骰子后再算；收起手骰时面板也会盖回去。'),
      ),
    )
  }
  if (!odds) {
    return h('section', { className: 'ld-side-card' },
      h('div', { className: 'ld-side-head' }, h('h4', null, '概率面板'), h('span', null, '可关闭')),
      h('div', { className: 'ld-empty' },
        h('b', null, turn && turn.kind === 'agent' ? 'Agent 回合' : '等你翻开手骰'),
        h('span', null, turn && turn.kind === 'agent'
          ? '对手的骰子不进入概率计算，面板在这里留空。'
          : '轮到真人座位时，这里会按你的手骰计算。'),
      ),
    )
  }
  if (odds.opening) {
    const faces = (odds.faces || []).slice().sort(function (a, b) { return b.known - a.known })
    return h('section', { className: 'ld-side-card' },
      h('div', { className: 'ld-side-head' }, h('h4', null, '概率面板'), h('span', null, '开局面')),
      h('div', { className: 'ld-empty', style: { padding: '8px 0 12px' } },
        h('b', null, '还没人叫价'),
        h('span', null, '先看手里哪一面最多，再决定从几颗开始。'),
      ),
      h('div', { className: 'ld-odds-row' }, h('span', null, '你的手骰'), h('b', null, odds.handSize + ' 颗')),
      h('div', { className: 'ld-odds-row' }, h('span', null, '未知骰'), h('b', null, odds.unknownDice + ' 颗')),
      h('div', { className: 'ld-suggest' },
        h('div', { className: 'ld-suggest-label' }, '手里最多的面'),
        h('div', { className: 'ld-suggest-list' }, faces.slice(0, 3).map(function (face) {
          return h('button', {
            key: face.face,
            type: 'button',
            onClick: function () { props.onSuggest(1, face.face) },
          }, h('span', null, face.face + ' 点'), h('span', null, '手里 ' + face.known + ' 颗'))
        })),
      ),
      props.suggestions && props.suggestions.length > 0
        ? h('div', { className: 'ld-suggest' },
          h('div', { className: 'ld-suggest-label' }, '开局参考'),
          h('div', { className: 'ld-suggest-list' }, props.suggestions.map(function (s) {
            return h('button', {
              key: s.qty + '-' + s.face,
              type: 'button',
              onClick: function () { props.onSuggest(s.qty, s.face) },
            }, h('span', null, s.qty + ' 个 ' + s.face), h('span', null, pct(s.pTrue) + '%'))
          })),
        )
        : null,
      h('div', { className: 'ld-foot' }, '概率按未知骰均匀分布计算；不推断对手是否在诈唬。'),
    )
  }
  const distribution = odds.distribution || []
  const maxP = distribution.reduce(function (max, row) { return Math.max(max, row.p) }, 0) || 1
  const first = distribution.length > 0 ? distribution[0].total : 0
  const last = distribution.length > 0 ? distribution[distribution.length - 1].total : 0
  return h('section', { className: 'ld-side-card' },
    h('div', { className: 'ld-side-head' },
      h('h4', null, '概率面板'),
      h('span', null, '仅按你的手骰'),
    ),
    h('div', { className: 'ld-odds-hero' },
      h('b', { style: { color: odds.challengeWin >= 0.5 ? 'var(--ld-good)' : 'var(--ld-bad)' } }, pct(odds.challengeWin) + '%'),
      h('span', null, '开盅胜率'),
    ),
    h('div', { className: 'ld-odds-sub' }, '叫价成立概率 ', h('b', null, pct(odds.pTrue) + '%'), ' · 预计 ', h('b', null, odds.expectedTotal.toFixed(1)), ' 颗'),
    h('div', { className: 'ld-meter' }, h('i', { style: { width: pct(odds.challengeWin) + '%' } })),
    h('div', { className: 'ld-dist', 'aria-hidden': 'true' }, distribution.map(function (row) {
      const height = 5 + Math.round((row.p / maxP) * 45)
      return h('i', {
        key: row.total,
        className: row.total >= odds.qty ? 'hot' : '',
        style: { height: height + 'px' },
        title: row.total + ' 颗：' + pct(row.p) + '%',
      })
    })),
    h('div', { className: 'ld-dist-axis' }, h('span', null, first + ' 颗'), h('span', null, '≥ ' + odds.qty + ' 为成立'), h('span', null, last + ' 颗')),
    h('div', { className: 'ld-odds-row' }, h('span', null, '你手里该点数'), h('b', null, odds.known + ' 颗')),
    h('div', { className: 'ld-odds-row' }, h('span', null, '未知骰'), h('b', null, odds.unknownDice + ' 颗')),
    h('div', { className: 'ld-odds-row' }, h('span', null, '当前叫价'), h('b', null, odds.qty + ' 个 ' + odds.face)),
    props.suggestions && props.suggestions.length > 0
      ? h('div', { className: 'ld-suggest' },
        h('div', { className: 'ld-suggest-label' }, '下一口参考'),
        h('div', { className: 'ld-suggest-list' }, props.suggestions.map(function (s) {
          return h('button', {
            key: s.qty + '-' + s.face,
            type: 'button',
            onClick: function () { props.onSuggest(s.qty, s.face) },
          }, h('span', null, s.qty + ' 个 ' + s.face), h('span', null, pct(s.pTrue) + '%'))
        })),
      )
      : props.suggestions
        ? h('div', { className: 'ld-suggest-empty' }, noRaise
          ? '没有更大的叫价了，只能开盅。'
          : '没有 ≥45% 的下一口：可以硬抬，或者直接开盅。')
        : null,
    h('div', { className: 'ld-foot' }, '数字只回答“如果均匀摇骰，这口成立的概率”；它不知道对面是不是在诈唬。'),
  )
}

function LogLine(props) {
  const event = props.event
  const table = props.table
  let content = null
  if (event.type === 'bid') {
    content = h('div', { className: 'ld-log-text' },
      h('b', null, playerName(table, event.playerId)), ' 叫 ',
      h('span', { className: 'q' }, event.qty + ' 个 ' + event.face),
      event.note ? h('span', { className: 'ld-log-note' }, '“' + event.note + '”') : null,
    )
  } else if (event.type === 'challenge') {
    content = h('div', { className: 'ld-log-text' },
      h('b', null, playerName(table, event.playerId)), ' 开盅 · 实际 ',
      h('span', { className: 'q' }, event.actual + ' 个 ' + event.target.face), ' · ',
      h('span', { className: event.bidTrue ? 'good' : 'bad' }, event.bidTrue ? '成立' : '不成立'),
      event.note ? h('span', { className: 'ld-log-note' }, '“' + event.note + '”') : null,
    )
  } else if (event.type === 'round-start') {
    content = h('div', { className: 'ld-log-text' }, '第 ' + event.round + ' 回合开始 · ' + playerName(table, event.starterId) + ' 先叫')
  } else if (event.type === 'match-start') {
    content = h('div', { className: 'ld-log-text' }, '对局开始 · ' + event.players.length + ' 位玩家')
  } else if (event.type === 'referee') {
    content = h('div', { className: 'ld-log-text' }, h('b', null, '裁判'), ' · ' + event.text)
  } else if (event.type === 'match-end') {
    content = h('div', { className: 'ld-log-text' }, '对局结束 · ' + playerName(table, event.winnerId) + ' 获胜')
  } else {
    content = h('div', { className: 'ld-log-text' }, eventLabel(table, event))
  }
  return h('div', { className: 'ld-log-item' },
    h('div', { className: 'ld-log-time' }, fmtTime(event.at)),
    content,
  )
}

function LogCard(props) {
  const table = props.table
  const rows = (table.events || []).slice(-9).reverse()
  return h('section', { className: 'ld-side-card' },
    h('div', { className: 'ld-side-head' },
      h('h4', null, '对局记录'),
      h('span', null, '实时'),
      h('span', { className: 'ld-spacer' }),
      h('button', { className: 'ld-btn ghost', type: 'button', onClick: props.onReplay, style: { padding: '2px 8px', fontSize: '11px' } }, '复盘'),
    ),
    rows.length === 0
      ? h('div', { className: 'ld-empty' }, h('b', null, '桌面还是空的'), h('span', null, '第一次叫价后这里会开始留痕。'))
      : h('div', { className: 'ld-log' }, rows.map(function (event, index) {
        return h(LogLine, { key: String(event.seq) + '-' + index, table: table, event: event })
      })),
  )
}

function HandControls(props) {
  const table = props.table
  const turn = playerById(table, table.turnId)
  const hand = table.activeHand
  const draft = props.draft
  const busy = props.busy === 'bid'
  if (!turn) return null
  if (turn.kind === 'agent') {
    return h('section', { className: 'ld-hand-card' },
      h('div', { className: 'ld-hand-head' }, h('h4', null, turn.name + ' 的回合'), h('span', null, 'Agent')),
      h('div', { className: 'ld-cover' },
        h('div', { style: { display: 'flex', gap: '6px' } },
          h(Dice, { back: true, size: 34 }), h(Dice, { back: true, size: 34 }), h(Dice, { back: true, size: 34 }),
        ),
        h('p', null, table.agentBusy ? '正在读牌面、算概率，顺便想想怎么诈你。' : '等它做一个决定…'),
      ),
    )
  }
  if (!Array.isArray(hand)) {
    return h('section', { className: 'ld-hand-card' },
      h('div', { className: 'ld-empty' }, h('b', null, '手骰还没到手'), h('span', null, '等这一回合发牌。')),
    )
  }
  const bid = table.currentBid
  const maxQty = table.legal ? table.legal.maxQty : table.totalDice
  const minQty = bid ? (bid.face === 6 ? bid.qty + 1 : bid.qty) : 1
  const noRaise = !table.legal || table.legal.next === null
  const legalNow = isLegalDraft(table, draft.qty, draft.face)
  const hint = bid
    ? '必须大于 ' + bid.qty + ' 个 ' + bid.face + (noRaise ? '；没有更大的叫价了，只能开盅。' : '')
    : '开局叫价：从 1 个 1 起，数量越多越难成立。'

  function setQty(next) {
    let qty = Math.max(minQty, Math.min(maxQty, next))
    let face = draft.face
    if (bid && qty === bid.qty && face <= bid.face) {
      face = bid.face + 1
      if (face > 6) {
        qty = Math.min(maxQty, bid.qty + 1)
        face = 1
      }
    }
    props.onDraft({ qty: qty, face: face })
  }

  function chooseFace(face) {
    let qty = draft.qty
    if (bid && qty === bid.qty && face <= bid.face) {
      if (bid.qty >= maxQty) return
      qty = bid.qty + 1
    }
    props.onDraft({ qty: qty, face: face })
  }

  function faceDisabled(face) {
    if (noRaise) return true
    if (!bid) return false
    if (draft.qty > bid.qty) return false
    return face <= bid.face
  }

  return h('section', { className: 'ld-hand-card' },
    h('div', { className: 'ld-hand-head' },
      h('h4', null, '你的手骰'),
      h('span', null, turn.name + ' · ' + hand.length + ' 颗'),
      h('span', { className: 'ld-spacer' }),
      props.peek
        ? h('button', { className: 'ld-btn ghost', type: 'button', onClick: function () { props.onPeek(false) } }, '收起')
        : null,
    ),
    props.peek
      ? h('div', { className: 'ld-hand-dice' }, hand.map(function (value, index) {
        return h(Dice, { key: index, value: value, size: 42 })
      }))
      : h('div', { className: 'ld-cover' },
        h('div', { style: { display: 'flex', gap: '6px' } }, hand.map(function (_, index) {
          return h(Dice, { key: index, back: true, size: 42 })
        })),
        h('button', { className: 'ld-btn', type: 'button', onClick: function () { props.onPeek(true) } }, '翻开手骰'),
        h('p', null, '热座轮流：看完再决定叫价。'),
      ),
    h('div', { className: 'ld-controls', style: { marginTop: '12px' } },
      h('div', { className: 'ld-controls-top' },
        h('div', null,
          h('div', { className: 'ld-field-label' }, '数量'),
          h('div', { className: 'ld-qty' },
            h('button', { className: 'ld-qty-btn', type: 'button', 'aria-label': '减少数量', disabled: draft.qty <= minQty, onClick: function () { setQty(draft.qty - 1) } }, '−'),
            h('div', { className: 'ld-qty-value' }, String(draft.qty)),
            h('button', { className: 'ld-qty-btn', type: 'button', 'aria-label': '增加数量', disabled: draft.qty >= maxQty, onClick: function () { setQty(draft.qty + 1) } }, '+'),
          ),
        ),
        h('div', null,
          h('div', { className: 'ld-field-label' }, '点数'),
          h('div', { className: 'ld-faces' }, [1, 2, 3, 4, 5, 6].map(function (face) {
            return h('button', {
              key: face,
              className: 'ld-face',
              type: 'button',
              'aria-pressed': draft.face === face,
              'aria-label': face + ' 点',
              disabled: faceDisabled(face),
              onClick: function () { chooseFace(face) },
            }, h(Dice, { value: face, size: 24 }))
          })),
        ),
      ),
      h('div', { className: 'ld-controls-bottom' },
        h('span', { className: 'ld-hint' }, hint),
        h('span', { className: 'ld-spacer' }),
        h('button', {
          className: 'ld-btn primary',
          type: 'button',
          disabled: busy || noRaise || !legalNow,
          onClick: function () { props.onSubmit(draft.qty, draft.face) },
        }, busy ? '叫价中…' : '叫 ' + draft.qty + ' 个 ' + draft.face),
      ),
    ),
  )
}

function RevealPanel(props) {
  const table = props.table
  const reveal = table.reveal
  const loserName = playerName(table, reveal.loserId)
  const bidderName = playerName(table, reveal.bidderId)
  const challengerName = playerName(table, reveal.challengerId)
  const referee = reveal.referee
  const busy = props.busy === 'next'
  return h('section', { className: 'ld-reveal' },
    h('div', { className: 'ld-reveal-head' },
      h('h4', null, '开盅'),
      h('span', { className: 'ld-outcome ' + (reveal.bidTrue ? 'true' : 'false') }, reveal.bidTrue ? '叫价成立' : '叫价不成立'),
      h('span', { className: 'ld-tag' }, '第 ' + table.round + ' 回合'),
    ),
    h('div', { className: 'ld-reveal-sum' },
      h('b', null, bidderName), ' 叫 ', h('b', null, reveal.qty + ' 个 ' + reveal.face), '，实际 ',
      h('b', null, reveal.actual + ' 个 ' + reveal.face), '。', h('b', null, loserName), ' 输一颗骰。',
      reveal.eliminated ? ' ' + loserName + ' 已出局。' : '',
    ),
    h('div', { className: 'ld-hands' }, table.players.map(function (p) {
      const hand = reveal.hands[p.id]
      if (!Array.isArray(hand)) return null
      return h('div', { className: 'ld-hand-row' + (p.id === reveal.loserId ? ' loser' : ''), key: p.id },
        h('div', { className: 'ld-hand-name' }, p.name, h('span', null, p.kind === 'agent' ? 'Agent' : '真人')),
        h('div', { className: 'ld-hand-dice compact' }, hand.map(function (value, index) {
          return h(Dice, { key: index, value: value, size: 24 })
        })),
        p.id === reveal.loserId ? h('span', { className: 'ld-loser-tag' }, '−1 颗') : null,
      )
    })),
    referee
      ? h('div', { className: 'ld-referee' },
        h('div', { className: 'ld-referee-head' }, '裁判', h('span', { style: { opacity: 0.6, fontWeight: 400 } }, referee.source === 'llm' ? 'Agent 复盘' : '规则复盘')),
        h('p', null, referee.text),
      )
      : table.config.referee
        ? h('div', { className: 'ld-referee' },
          h('div', { className: 'ld-referee-head' }, '裁判', h('span', { style: { opacity: 0.6, fontWeight: 400 } }, table.refereeBusy ? 'Agent 正在复盘' : '等待复盘')),
          h('p', null, table.refereeBusy ? '正在读这一回合的叫价和概率…' : '开盅后会自动生成一句裁判点评。'),
        )
        : h('div', { className: 'ld-foot' }, '本局未开启裁判点评。'),
    h('div', { className: 'ld-reveal-actions' },
      h('button', { className: 'ld-btn primary', type: 'button', disabled: busy, onClick: props.onNext }, busy ? '结算中…' : (reveal.matchOver ? '看最终结果' : '下一回合')),
      h('button', { className: 'ld-btn ghost', type: 'button', onClick: props.onReplay }, '看复盘'),
      h('span', { className: 'ld-start-note' }, challengerName + ' 当时估算 ' + pct(reveal.oddsAtChallenge ? reveal.oddsAtChallenge.challengeWin : 0) + '%。'),
    ),
  )
}

function GameOverPanel(props) {
  const table = props.table
  const winner = playerById(table, table.winnerId)
  const standings = table.players.slice().sort(function (a, b) {
    if (a.alive !== b.alive) return a.alive ? -1 : 1
    if (b.diceCount !== a.diceCount) return b.diceCount - a.diceCount
    return a.stats.diceLost - b.stats.diceLost
  })
  const busy = props.busy === 'new'
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
    h('section', { className: 'ld-winner' },
      h('div', { className: 'ld-trophy', 'aria-hidden': 'true' }, '♛'),
      h('h3', null, winner ? winner.name + ' 赢下这张桌子' : '对局结束'),
      h('p', null, winner && winner.kind === 'agent' ? 'Agent 把最后几颗骰子守住了。' : '最后一位还有骰子的人获胜。'),
      h('div', { className: 'ld-standings' }, standings.map(function (p) {
        return h('div', { className: 'ld-standing', key: p.id },
          h('span', null, p.name),
          h('span', { className: 'ld-tag' + (p.kind === 'agent' ? ' agent' : '') }, p.kind === 'agent' ? 'Agent' : '真人'),
          h('b', null, p.alive ? p.diceCount + ' 颗' : '出局'),
        )
      })),
      h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' } },
        h('button', { className: 'ld-btn primary', type: 'button', disabled: busy, onClick: props.onRestart }, busy ? '开桌中…' : '再来一局'),
        h('button', { className: 'ld-btn', type: 'button', onClick: props.onReplay }, '复盘整局'),
        h('button', { className: 'ld-btn ghost', type: 'button', onClick: props.onReset }, '回到设置'),
      ),
    ),
    h('section', { className: 'ld-card' },
      h('div', { className: 'ld-section-title' }, h('h3', null, '这一局'), h('span', null, '数字都来自记录')),
      h('div', { className: 'ld-odds-row' }, h('span', null, '回合'), h('b', null, table.totals.rounds)),
      h('div', { className: 'ld-odds-row' }, h('span', null, '叫价'), h('b', null, table.totals.bids + ' 次')),
      h('div', { className: 'ld-odds-row' }, h('span', null, '开盅'), h('b', null, table.totals.challenges + ' 次')),
      h('div', { className: 'ld-odds-row' }, h('span', null, '裁判点评'), h('b', null, table.totals.referees + ' 条')),
    ),
  )
}

function GameView(props) {
  const table = props.table
  const [draft, setDraft] = React.useState({ qty: 1, face: 1 })
  const [peek, setPeek] = React.useState(false)
  const autoAgent = React.useRef('')
  const autoReferee = React.useRef('')
  const busy = props.busy

  React.useEffect(function () {
    if (!table || table.phase !== 'bidding') return undefined
    let next = table.legal && table.legal.next ? table.legal.next : { qty: 1, face: 1 }
    if (!table.legal || table.legal.next === null) {
      next = table.currentBid ? { qty: table.currentBid.qty, face: table.currentBid.face } : next
    }
    if (!table.currentBid && table.odds && Array.isArray(table.odds.faces)) {
      const best = table.odds.faces.slice().sort(function (a, b) { return b.known - a.known })[0]
      if (best && best.known > 0) next = { qty: 1, face: best.face }
    }
    setDraft({ qty: next.qty, face: next.face })
    setPeek(false)
  }, [table.round, table.turnId, table.currentBid ? table.currentBid.seq : 0, table.phase])

  React.useEffect(function () {
    if (!table || table.phase !== 'bidding') return undefined
    const turn = playerById(table, table.turnId)
    if (!turn || turn.kind !== 'agent' || table.agentBusy) return undefined
    const key = table.round + ':' + table.turnId + ':' + (table.currentBid ? table.currentBid.seq : 0)
    if (autoAgent.current === key) return undefined
    autoAgent.current = key
    const timer = setTimeout(function () {
      post('agent', {}).catch(function () { autoAgent.current = '' })
    }, 500)
    return function () { clearTimeout(timer) }
  }, [table.round, table.turnId, table.currentBid ? table.currentBid.seq : 0, table.phase, table.agentBusy])

  React.useEffect(function () {
    if (!table || table.phase !== 'reveal' || !table.reveal) return undefined
    if (!table.config.referee || table.reveal.referee || table.refereeBusy) return undefined
    const key = table.round + ':' + table.reveal.seq
    if (autoReferee.current === key) return undefined
    autoReferee.current = key
    const timer = setTimeout(function () {
      post('referee', {}).catch(function () { autoReferee.current = '' })
    }, 600)
    return function () { clearTimeout(timer) }
  }, [table.round, table.phase, table.reveal ? table.reveal.seq : 0, table.config.referee, table.reveal ? Boolean(table.reveal.referee) : false, table.refereeBusy])

  if (table.phase === 'gameover') {
    return h(GameOverPanel, {
      table: table,
      busy: busy,
      onRestart: function () { props.act('new', { config: configOf(table) }) },
      onReplay: props.onReplay,
      onReset: props.onReset,
    })
  }

  const turn = playerById(table, table.turnId)
  const isHumanTurn = table.phase === 'bidding' && turn && turn.kind === 'human'
  const canChallenge = isHumanTurn && table.currentBid !== null
  return h('div', { className: 'ld-game' },
    h('div', { className: 'ld-main' },
      h('section', { className: 'ld-table-card' },
        h('div', { className: 'ld-seats' }, table.players.map(function (p) {
          return h(Seat, {
            key: p.id,
            player: p,
            table: table,
            active: table.phase === 'bidding' && p.id === table.turnId,
          })
        })),
        h(BidDisplay, {
          table: table,
          busy: busy === 'challenge',
          canChallenge: canChallenge,
          onChallenge: function () { props.act('challenge', {}) },
        }),
      ),
      table.phase === 'reveal'
        ? h(RevealPanel, {
          table: table,
          busy: busy,
          onNext: function () { props.act('next', {}) },
          onReplay: props.onReplay,
        })
        : h(HandControls, {
          table: table,
          draft: draft,
          peek: peek,
          busy: busy,
          onDraft: setDraft,
          onPeek: setPeek,
          onSubmit: function (qty, face) { props.act('bid', { qty: qty, face: face }) },
        }),
    ),
    h('aside', { className: 'ld-side' },
      props.oddsOn
        ? h(OddsCard, {
          table: table,
          peek: peek,
          suggestions: table.odds ? table.odds.suggestions : null,
          onSuggest: function (qty, face) { setDraft({ qty: qty, face: face }) },
        })
        : null,
      h(LogCard, { table: table, onReplay: props.onReplay }),
    ),
  )
}

// ---------------------------------------------------------------------------
// replay
// ---------------------------------------------------------------------------

function ReplayView(props) {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState(1)
  const [reloadKey, setReloadKey] = React.useState(0)

  React.useEffect(function () {
    let cancelled = false
    setLoading(true)
    fetchReplay()
      .then(function (replay) {
        if (cancelled) return
        setData(replay)
        setError('')
        const rounds = replay.rounds || []
        const latest = rounds.length > 0 ? rounds[rounds.length - 1].round : 1
        setSelected(latest)
      })
      .catch(function (err) {
        if (cancelled) return
        setError(String((err && err.message) || err))
      })
      .finally(function () {
        if (!cancelled) setLoading(false)
      })
    return function () { cancelled = true }
  }, [props.table ? props.table.round : 0, props.table ? props.table.phase : '', reloadKey])

  function reload() {
    setError('')
    setData(null)
    setLoading(true)
    setReloadKey(function (value) { return value + 1 })
  }

  if (loading && !data) {
    return h('div', { className: 'ld-card' }, h('div', { className: 'ld-loading' }, h('span', { className: 'ld-spin' }), '正在读复盘…'))
  }
  if (error) {
    return h('div', { className: 'ld-card' },
      h('div', { className: 'ld-error' }, '读复盘失败：' + error,
        h('button', { className: 'ld-btn', type: 'button', onClick: reload }, '重试'),
      ),
    )
  }
  if (!data) return null
  const match = data.match || {}
  const rounds = data.rounds || []
  const current = rounds.find(function (round) { return round.round === selected }) || rounds[0]
  if (!current) {
    return h('div', { className: 'ld-card' }, h('div', { className: 'ld-empty' }, h('b', null, '还没有可复盘的记录'), h('span', null, '先叫一口，或者等第一回合结束。')))
  }
  const winner = playerById(match, match.winnerId)
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
    h('div', { className: 'ld-card' },
      h('div', { className: 'ld-replay-head' },
        h('h3', null, '复盘'),
        h('span', null, match.config ? match.config.dicePerPlayer + ' 颗 / 人 · ' + (match.config.wildOnes ? '万能 1' : '1 不当万能') : ''),
        h('span', { className: 'ld-spacer', style: { flex: 1 } }),
        h('button', { className: 'ld-btn', type: 'button', onClick: reload }, '刷新'),
        h('button', { className: 'ld-btn primary', type: 'button', onClick: props.onBack }, '回到牌桌'),
      ),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '7px', marginTop: '10px' } },
        h('div', { className: 'ld-standing' }, h('span', null, '叫价'), h('b', null, match.totals ? match.totals.bids : 0)),
        h('div', { className: 'ld-standing' }, h('span', null, '开盅'), h('b', null, match.totals ? match.totals.challenges : 0)),
        h('div', { className: 'ld-standing' }, h('span', null, '回合'), h('b', null, match.totals ? match.totals.rounds : 0)),
        h('div', { className: 'ld-standing' }, h('span', null, '结果'), h('b', null, winner ? winner.name + ' 胜' : (match.phase === 'gameover' ? '已结束' : '进行中'))),
      ),
    ),
    h('div', { className: 'ld-replay' },
      h('div', { className: 'ld-card' },
        h('div', { className: 'ld-section-title' }, h('h3', null, '回合'), h('span', null, rounds.length + ' 个记录')),
        h('div', { className: 'ld-replay-list' }, rounds.map(function (round) {
          const challenge = round.challenge
          return h('button', {
            key: round.round,
            type: 'button',
            className: 'ld-round-btn',
            'aria-pressed': selected === round.round,
            onClick: function () { setSelected(round.round) },
          },
            h('b', null, '第 ' + round.round + ' 回合'),
            h('span', null, challenge
              ? (challenge.bidTrue ? '叫价成立' : '叫价不成立') + ' · 实际 ' + challenge.actual + ' 个'
              : '进行中 · ' + round.events.length + ' 条叫价'),
          )
        })),
      ),
      h('div', { className: 'ld-card ld-replay-detail' },
        h('div', { className: 'ld-replay-head' },
          h('h3', null, '第 ' + current.round + ' 回合'),
          h('span', null, current.starterId ? '由 ' + playerName(match, current.starterId) + ' 先叫' : ''),
          h('span', { className: 'ld-tag' }, current.complete ? '已开盅' : '进行中'),
        ),
        current.challenge
          ? h('div', { className: 'ld-replay-result ' + (current.challenge.bidTrue ? 'true' : 'false') },
            h('span', { className: 'ld-outcome ' + (current.challenge.bidTrue ? 'true' : 'false') }, current.challenge.bidTrue ? '叫价成立' : '叫价不成立'),
            h('span', null, playerName(match, current.challenge.target.bidderId) + ' 叫 ' + current.challenge.target.qty + ' 个 ' + current.challenge.target.face),
            h('span', null, '实际 ' + current.challenge.actual + ' 个'),
            h('b', null, playerName(match, current.loserId) + ' 输一颗' + (current.eliminatedId ? '，出局' : '')),
          )
          : null,
        current.dice
          ? h('div', { className: 'ld-replay-dice' }, (match.players || []).map(function (p) {
            const hand = current.dice[p.id]
            if (!Array.isArray(hand)) return null
            return h('div', { className: 'ld-replay-hand' + (current.loserId === p.id ? ' loser' : ''), key: p.id },
              h('span', null, p.name),
              h('div', { className: 'ld-hand-dice compact' }, hand.map(function (value, index) {
                return h(Dice, { key: index, value: value, size: 22 })
              })),
              current.loserId === p.id ? h('span', { className: 'ld-loser-tag' }, '−1 颗') : null,
            )
          }))
          : h('div', { className: 'ld-replay-empty' }, '这一回合还没开盅，骰子仍然保密；下面的叫价记录是公开的。'),
        h('div', { className: 'ld-replay-events' },
          current.events.length === 0
            ? h('div', { className: 'ld-replay-empty' }, '这一回合还没有叫价。')
            : current.events.map(function (event, index) {
              return h('div', { className: 'ld-replay-event', key: event.seq },
                h('span', { className: 'seq' }, '#' + (index + 1)),
                h('span', null, eventLabel(match, event)),
                h('span', { className: 'when' }, fmtTime(event.at)),
              )
            }),
        ),
        h('div', { className: 'ld-replay-note' },
          '记录包含每一次叫价和开盅。开盅前的当前回合只展示公开叫价，骰子要等掀杯后才进入复盘。',
        ),
      ),
    ),
  )
}

// ---------------------------------------------------------------------------
// header + app
// ---------------------------------------------------------------------------

function Header(props) {
  return h('header', { className: 'ld-header' },
    h('div', { className: 'ld-brand' },
      h('div', { className: 'ld-logo', 'aria-hidden': 'true' },
        h('div', { className: 'ld-mini-table' }, h('i'), h('i'), h('i')),
      ),
      h('div', { className: 'ld-brand-text' },
        h('h1', null, '吹牛骰子'),
        h('p', null, props.table
          ? '第 ' + props.table.round + ' 回合 · 共 ' + props.table.totalDice + ' 颗骰子 · 叫价和开盅都留痕'
          : '本地热座 · Agent 可当对手或裁判 · 可回放'),
      ),
    ),
    h('div', { className: 'ld-actions' },
      props.table
        ? h('div', { className: 'ld-tabs', role: 'group', 'aria-label': '视图' },
          h('button', { type: 'button', 'aria-pressed': props.mode === 'table', onClick: function () { props.onMode('table') } }, '对局'),
          h('button', { type: 'button', 'aria-pressed': props.mode === 'replay', onClick: function () { props.onMode('replay') } }, '复盘'),
        )
        : null,
      props.table && props.mode === 'table'
        ? h(Switch, { checked: props.oddsOn, onChange: props.onOdds, label: '概率' })
        : null,
      props.table
        ? h('button', {
          className: 'ld-btn ghost',
          type: 'button',
          onClick: props.onNew,
        }, props.mode === 'replay' ? '回到牌桌' : '新对局')
        : null,
    ),
  )
}

function App() {
  const [state, setState] = React.useState(snap)
  const [mode, setMode] = React.useState('table')
  const [oddsOn, setOddsOn] = React.useState(readStorage(ODDS_KEY, '1') !== '0')
  const [busy, setBusy] = React.useState('')

  React.useEffect(function () { return subscribe(setState) }, [])

  const data = state.data
  const table = data && data.table ? data.table : null
  const defaults = data && data.defaults ? data.defaults : DEFAULT_SETUP

  React.useEffect(function () {
    if (!table && mode === 'replay') setMode('table')
  }, [table ? 1 : 0, mode])

  function act(method, body) {
    setBusy(method)
    return post(method, body)
      .catch(function () {})
      .finally(function () { setBusy('') })
  }

  function toggleOdds(next) {
    setOddsOn(next)
    writeStorage(ODDS_KEY, next ? '1' : '0')
  }

  function newMatch() {
    if (!table) return
    if (typeof window !== 'undefined' && !window.confirm('结束当前对局，开一桌新的？')) return
    setMode('table')
    act('reset', {})
  }

  function backToTable() {
    setMode('table')
  }

  return h('div', { className: 'ld-root' },
    h(Header, {
      table: table,
      mode: mode,
      oddsOn: oddsOn,
      onMode: setMode,
      onOdds: toggleOdds,
      onNew: mode === 'replay' ? backToTable : newMatch,
    }),
    state.error
      ? h('div', { className: 'ld-error' },
        '与 host 通信失败：' + state.error,
        h('button', { className: 'ld-btn', type: 'button', onClick: function () { load() } }, '重试'),
      )
      : null,
    !table
      ? h(SetupView, {
        defaults: defaults,
        llm: data ? data.llm : null,
        busy: busy,
        onStart: function (config) { act('new', { config: config }) },
      })
      : mode === 'replay'
        ? h(ReplayView, { table: table, onBack: backToTable })
        : h(GameView, {
          table: table,
          busy: busy,
          oddsOn: oddsOn,
          act: act,
          onReplay: function () { setMode('replay') },
          onReset: function () { act('reset', {}) },
        }),
  )
}

function apply(ctx) {
  ctx.effect(function () {
    return function () {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
      listeners.clear()
      snap = { data: null, error: '', at: 0 }
    }
  })

  ctx.effect(function () {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-liars-dice'
    style.textContent = CSS
    document.head.appendChild(style)
    return function () { style.remove() }
  })

  ctx.slots.inject('conversation.view', function () {
    let disposeView
    try {
      disposeView = ctx.slots.register(
        { name: 'conversation.view', id: 'liars-dice', order: 31, label: '吹牛骰子' },
        App,
      )
    } catch (error) {
      disposeView = undefined
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[dsh-liars-dice] could not register the 吹牛骰子 view', error)
      }
    }
    return typeof disposeView === 'function' ? disposeView : function () {}
  })
}

module.exports = {
  name: 'dsh-liars-dice',
  inject: ['slots'],
  apply: apply,
}

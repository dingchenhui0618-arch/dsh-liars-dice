/* dsh-liars-dice client bundle — generated from src/client.cjs */
window.__ModuleLoader__.load({
  id: "dsh-liars-dice",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
// Client half of dsh-liars-dice: the 吹牛骰子 Tab in the conversation view.
//
// Must stay CommonJS — the build wraps this in window.__ModuleLoader__.load()
// and React is supplied by the harness (esbuild marks it external).

const React = require('react')
const h = React.createElement
const CSS = ".ld-root{--ld-line:color-mix(in srgb,currentColor 13%,transparent);--ld-line-strong:color-mix(in srgb,currentColor 26%,transparent);--ld-surface:color-mix(in srgb,currentColor 4%,transparent);--ld-surface-2:color-mix(in srgb,currentColor 7%,transparent);--ld-muted:color-mix(in srgb,currentColor 58%,transparent);--ld-faint:color-mix(in srgb,currentColor 38%,transparent);--ld-gold:#c58a2c;--ld-gold-text:color-mix(in srgb,#b7791f 78%,currentColor);--ld-gold-soft:color-mix(in srgb,#c58a2c 16%,transparent);--ld-good:color-mix(in srgb,#15803d 76%,currentColor);--ld-good-soft:color-mix(in srgb,#15803d 13%,transparent);--ld-bad:color-mix(in srgb,#b91c1c 78%,currentColor);--ld-bad-soft:color-mix(in srgb,#b91c1c 12%,transparent);display:flex;flex-direction:column;gap:18px;padding:20px 22px 30px;min-height:100%;overflow:auto;color:inherit;font-family:ui-sans-serif,system-ui,-apple-system,\"Segoe UI\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif;font-size:13px;line-height:1.55}.ld-root *{box-sizing:border-box}.ld-root button{font:inherit}.ld-header{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ld-brand{display:flex;align-items:center;gap:12px;min-width:0}.ld-logo{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,#e7c477 34%,transparent),color-mix(in srgb,#b7791f 12%,transparent));border:1px solid color-mix(in srgb,#c58a2c 38%,transparent);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 28%,transparent)}.ld-logo .ld-mini-table{width:24px;height:24px;position:relative}.ld-logo .ld-mini-table i{position:absolute;display:block;width:10px;height:10px;border-radius:3px;background:#f7f1e3;box-shadow:0 1px 2px rgba(20,15,5,.28)}.ld-logo .ld-mini-table i:nth-child(1){left:0;top:2px;transform:rotate(-12deg)}.ld-logo .ld-mini-table i:nth-child(2){right:1px;top:7px;transform:rotate(9deg)}.ld-logo .ld-mini-table i:nth-child(3){left:6px;bottom:0;transform:rotate(3deg)}.ld-brand-text{min-width:0}.ld-brand-text h1{margin:0;font-size:18px;line-height:1.2;font-weight:650;letter-spacing:.01em}.ld-brand-text p{margin:2px 0 0;font-size:12px;color:var(--ld-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ld-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ld-tabs{display:inline-flex;padding:3px;border:1px solid var(--ld-line);border-radius:10px;background:var(--ld-surface)}.ld-tabs button{border:0;background:transparent;color:var(--ld-muted);font-size:12px;padding:4px 11px;border-radius:7px;cursor:pointer}.ld-tabs button[aria-pressed=\"true\"]{background:var(--ld-gold-soft);color:var(--ld-gold-text);box-shadow:inset 0 0 0 1px color-mix(in srgb,#c58a2c 22%,transparent)}.ld-btn{border:1px solid var(--ld-line);background:transparent;color:inherit;font-size:12px;padding:6px 12px;border-radius:8px;cursor:pointer;transition:background .15s,border-color .15s,opacity .15s;white-space:nowrap}.ld-btn:hover{background:var(--ld-surface-2)}.ld-btn:disabled{opacity:.42;cursor:not-allowed}.ld-btn:focus-visible,.ld-icon-btn:focus-visible,.ld-tabs button:focus-visible,.ld-face:focus-visible,.ld-qty-btn:focus-visible,.ld-suggest button:focus-visible{outline:2px solid color-mix(in srgb,#c58a2c 60%,currentColor);outline-offset:2px}.ld-btn.primary{background:linear-gradient(180deg,#e5b765,#c58a2c);border-color:color-mix(in srgb,#8a5a16 55%,transparent);color:#221706;font-weight:600;box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 4px 12px color-mix(in srgb,#c58a2c 22%,transparent)}.ld-btn.primary:hover{filter:brightness(1.04)}.ld-btn.danger{color:var(--ld-bad);border-color:color-mix(in srgb,#b91c1c 38%,transparent);background:var(--ld-bad-soft)}.ld-btn.ghost{color:var(--ld-muted)}.ld-switch{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--ld-muted);cursor:pointer;user-select:none}.ld-switch input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.ld-track{width:30px;height:17px;border-radius:999px;border:1px solid var(--ld-line-strong);background:var(--ld-surface-2);position:relative;transition:background .18s,border-color .18s;flex:0 0 auto}.ld-thumb{position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:color-mix(in srgb,currentColor 65%,transparent);transition:transform .18s,background .18s}.ld-switch input:checked + .ld-track{background:var(--ld-gold-soft);border-color:color-mix(in srgb,#c58a2c 55%,transparent)}.ld-switch input:checked + .ld-track .ld-thumb{transform:translateX(13px);background:var(--ld-gold)}.ld-switch input:focus-visible + .ld-track{outline:2px solid color-mix(in srgb,#c58a2c 60%,currentColor);outline-offset:2px}.ld-error{border:1px solid color-mix(in srgb,#b91c1c 45%,transparent);background:var(--ld-bad-soft);color:var(--ld-bad);border-radius:10px;padding:8px 12px;font-size:12px;display:flex;align-items:center;gap:10px}.ld-error .ld-btn{margin-left:auto;color:inherit;border-color:color-mix(in srgb,#b91c1c 35%,transparent)}.ld-setup{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,.6fr);gap:18px;align-items:start}.ld-card{border:1px solid var(--ld-line);background:var(--ld-surface);border-radius:16px;padding:16px 18px}.ld-hero{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,#c58a2c 22%,var(--ld-line));background:radial-gradient(120% 130% at 88% -10%,color-mix(in srgb,#c58a2c 16%,transparent),transparent 55%),linear-gradient(160deg,color-mix(in srgb,currentColor 5%,transparent),transparent 70%),var(--ld-surface)}.ld-hero::after{content:\"\";position:absolute;right:-70px;bottom:-90px;width:240px;height:240px;border-radius:50%;border:1px dashed color-mix(in srgb,#c58a2c 24%,transparent);opacity:.7}.ld-hero-inner{position:relative;z-index:1;display:flex;gap:22px;align-items:center;justify-content:space-between}.ld-hero-copy{max-width:560px}.ld-kicker{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ld-gold-text);font-weight:650;margin-bottom:6px}.ld-hero h2{margin:0 0 8px;font-size:25px;line-height:1.22;letter-spacing:-.01em;font-weight:680}.ld-hero h2 em{font-style:normal;color:var(--ld-gold-text)}.ld-lead{margin:0;font-size:13px;color:var(--ld-muted);max-width:520px}.ld-hero-dice{display:flex;gap:8px;flex:0 0 auto;padding-right:8px}.ld-hero-dice .ld-die:nth-child(1){transform:rotate(-9deg) translateY(4px)}.ld-hero-dice .ld-die:nth-child(2){transform:rotate(4deg) translateY(-4px)}.ld-hero-dice .ld-die:nth-child(3){transform:rotate(12deg) translateY(7px)}.ld-section-title{display:flex;align-items:baseline;gap:8px;margin:0 0 12px}.ld-section-title h3{margin:0;font-size:13px;font-weight:650}.ld-section-title span{font-size:11px;color:var(--ld-faint)}.ld-seat-list{display:flex;flex-direction:column;gap:8px}.ld-seat-row{display:grid;grid-template-columns:24px minmax(0,1fr) auto 28px;gap:9px;align-items:center;border:1px solid var(--ld-line);border-radius:11px;padding:7px 9px;background:var(--ld-surface)}.ld-seat-index{font-size:11px;color:var(--ld-faint);font-variant-numeric:tabular-nums;text-align:center}.ld-input{width:100%;border:1px solid transparent;background:transparent;color:inherit;font:inherit;font-size:13px;padding:4px 6px;border-radius:6px;min-width:0}.ld-input:hover{background:var(--ld-surface-2)}.ld-input:focus{outline:none;border-color:color-mix(in srgb,#c58a2c 55%,transparent);background:var(--ld-surface-2)}.ld-kind-toggle{display:inline-flex;padding:2px;border:1px solid var(--ld-line);border-radius:8px;background:var(--ld-surface)}.ld-kind-toggle button{border:0;background:transparent;color:var(--ld-muted);font-size:11px;padding:3px 9px;border-radius:6px;cursor:pointer}.ld-kind-toggle button[aria-pressed=\"true\"]{background:var(--ld-gold-soft);color:var(--ld-gold-text);box-shadow:inset 0 0 0 1px color-mix(in srgb,#c58a2c 22%,transparent)}.ld-icon-btn{width:26px;height:26px;border:0;background:transparent;color:var(--ld-faint);border-radius:6px;cursor:pointer;display:grid;place-items:center;font-size:15px;line-height:1}.ld-icon-btn:hover{background:var(--ld-bad-soft);color:var(--ld-bad)}.ld-icon-btn:disabled{opacity:.25;cursor:not-allowed}.ld-seat-actions{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}.ld-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:14px}.ld-option{border:1px solid var(--ld-line);border-radius:11px;padding:9px 11px;background:var(--ld-surface)}.ld-option-label{font-size:11px;color:var(--ld-muted);margin-bottom:5px}.ld-option-value{font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:8px}.ld-mini-seg{display:inline-flex;gap:2px}.ld-mini-seg button{border:1px solid var(--ld-line);background:transparent;color:var(--ld-muted);font-size:11px;padding:2px 8px;border-radius:6px;cursor:pointer}.ld-mini-seg button[aria-pressed=\"true\"]{background:var(--ld-gold-soft);color:var(--ld-gold-text);border-color:color-mix(in srgb,#c58a2c 38%,transparent)}.ld-start-row{display:flex;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap}.ld-start-note{font-size:11px;color:var(--ld-faint)}.ld-rules{display:flex;flex-direction:column;gap:13px}.ld-rule-step{display:grid;grid-template-columns:22px 1fr;gap:9px;align-items:start}.ld-rule-num{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:650;color:var(--ld-gold-text);background:var(--ld-gold-soft);border:1px solid color-mix(in srgb,#c58a2c 30%,transparent)}.ld-rule-step b{display:block;font-size:12px;font-weight:650;margin-bottom:1px}.ld-rule-step span{font-size:11.5px;color:var(--ld-muted)}.ld-note{border-top:1px solid var(--ld-line);padding-top:11px;font-size:11px;color:var(--ld-faint)}.ld-game{display:grid;grid-template-columns:minmax(0,1fr) 318px;gap:18px;align-items:start}.ld-main{display:flex;flex-direction:column;gap:12px;min-width:0}.ld-table-card{border:1px solid var(--ld-line);background:var(--ld-surface);border-radius:18px;padding:13px}.ld-seats{display:grid;grid-template-columns:repeat(auto-fit,minmax(142px,1fr));gap:7px;margin-bottom:12px}.ld-seat{position:relative;display:flex;align-items:center;gap:8px;border:1px solid var(--ld-line);border-radius:11px;padding:7px 9px;background:var(--ld-surface);min-width:0;transition:border-color .2s,background .2s,box-shadow .2s}.ld-seat.active{border-color:color-mix(in srgb,#c58a2c 62%,transparent);background:var(--ld-gold-soft);box-shadow:0 0 0 1px color-mix(in srgb,#c58a2c 16%,transparent)}.ld-seat.out{opacity:.46}.ld-seat.out .ld-seat-name{text-decoration:line-through}.ld-avatar{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;font-size:12px;font-weight:650;background:color-mix(in srgb,currentColor 10%,transparent);border:1px solid var(--ld-line);position:relative}.ld-avatar.agent{background:linear-gradient(145deg,color-mix(in srgb,#c58a2c 26%,transparent),color-mix(in srgb,#7c5a1e 10%,transparent));border-color:color-mix(in srgb,#c58a2c 34%,transparent)}.ld-avatar .ld-agent-dot{position:absolute;right:-2px;bottom:-2px;width:9px;height:9px;border-radius:50%;background:var(--ld-gold);border:2px solid color-mix(in srgb,Canvas 65%,transparent)}.ld-seat-body{min-width:0;flex:1}.ld-seat-top{display:flex;align-items:center;gap:5px;min-width:0}.ld-seat-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ld-tag{font-size:9px;letter-spacing:.03em;padding:0 5px;border-radius:999px;border:1px solid var(--ld-line);color:var(--ld-muted);white-space:nowrap}.ld-tag.agent{color:var(--ld-gold-text);border-color:color-mix(in srgb,#c58a2c 32%,transparent);background:var(--ld-gold-soft)}.ld-seat-meta{font-size:10.5px;color:var(--ld-muted);margin-top:1px;display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ld-seat-meta .dot{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.4;flex:0 0 auto}.ld-seat-status{font-size:10px;color:var(--ld-gold-text);margin-top:1px;min-height:13px}.ld-seat-status.thinking{color:var(--ld-gold-text)}.ld-felt{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,#1f6f50 35%,var(--ld-line));border-radius:15px;padding:18px 18px 16px;min-height:176px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;background:radial-gradient(95% 120% at 50% 0%,color-mix(in srgb,#1f6f50 20%,transparent),transparent 62%),radial-gradient(80% 100% at 50% 100%,color-mix(in srgb,#0f4f38 12%,transparent),transparent 60%),color-mix(in srgb,currentColor 3%,transparent)}.ld-felt::before{content:\"\";position:absolute;inset:9px;border-radius:10px;border:1px dashed color-mix(in srgb,#1f6f50 24%,transparent);pointer-events:none}.ld-felt::after{content:\"\";position:absolute;width:300px;height:300px;border-radius:50%;border:1px solid color-mix(in srgb,#1f6f50 13%,transparent);pointer-events:none}.ld-felt > *{position:relative;z-index:1}.ld-round-tag{position:absolute;left:16px;top:12px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb,currentColor 48%,transparent);z-index:1}.ld-felt-bid{display:flex;align-items:center;gap:13px}.ld-bid-num{font-size:42px;line-height:.95;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.03em}.ld-bid-unit{font-size:13px;color:var(--ld-muted);margin-left:-7px;align-self:flex-end;padding-bottom:6px}.ld-bid-meta{display:flex;flex-direction:column;align-items:flex-start;gap:2px;margin-left:3px}.ld-bid-by{font-size:12px;font-weight:600}.ld-bid-note{font-size:11px;color:var(--ld-muted);max-width:190px;font-style:italic}.ld-empty-bid{text-align:center}.ld-empty-bid b{display:block;font-size:15px;font-weight:600;margin-bottom:2px}.ld-empty-bid span{font-size:11.5px;color:var(--ld-muted)}.ld-turn{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ld-muted);min-height:18px}.ld-turn b{color:inherit;font-weight:600}.ld-pulse{width:6px;height:6px;border-radius:50%;background:var(--ld-gold);box-shadow:0 0 0 0 color-mix(in srgb,#c58a2c 45%,transparent);animation:ld-pulse 1.8s ease-out infinite}@keyframes ld-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,#c58a2c 40%,transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}.ld-challenge{margin-top:2px}.ld-hand-card{border:1px solid var(--ld-line);background:var(--ld-surface);border-radius:14px;padding:12px 14px}.ld-hand-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}.ld-hand-head h4{margin:0;font-size:12px;font-weight:650}.ld-hand-head span{font-size:11px;color:var(--ld-faint)}.ld-hand-head .ld-spacer{flex:1}.ld-hand-dice{display:flex;gap:8px;flex-wrap:wrap;align-items:center;min-height:44px}.ld-cover{display:flex;align-items:center;gap:12px;min-height:44px;flex-wrap:wrap}.ld-cover p{margin:0;font-size:11.5px;color:var(--ld-muted)}.ld-controls{border:1px solid var(--ld-line);background:var(--ld-surface);border-radius:14px;padding:13px 14px}.ld-controls-top{display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap}.ld-field-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ld-faint);margin-bottom:5px}.ld-qty{display:flex;align-items:center;gap:7px}.ld-qty-btn{width:29px;height:29px;border:1px solid var(--ld-line);background:var(--ld-surface-2);color:inherit;border-radius:8px;cursor:pointer;font-size:15px;line-height:1;display:grid;place-items:center}.ld-qty-btn:hover{background:var(--ld-surface)}.ld-qty-btn:disabled{opacity:.3;cursor:not-allowed}.ld-qty-value{min-width:38px;text-align:center;font-size:23px;font-weight:650;font-variant-numeric:tabular-nums}.ld-faces{display:flex;gap:5px;flex-wrap:wrap}.ld-face{width:38px;height:42px;border:1px solid var(--ld-line);background:var(--ld-surface);border-radius:9px;cursor:pointer;display:grid;place-items:center;padding:0;transition:border-color .15s,background .15s,transform .12s}.ld-face:hover:not(:disabled){transform:translateY(-1px);border-color:var(--ld-line-strong)}.ld-face[aria-pressed=\"true\"]{border-color:color-mix(in srgb,#c58a2c 62%,transparent);background:var(--ld-gold-soft);box-shadow:0 0 0 1px color-mix(in srgb,#c58a2c 18%,transparent)}.ld-face:disabled{opacity:.28;cursor:not-allowed}.ld-controls-bottom{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}.ld-hint{font-size:11px;color:var(--ld-muted)}.ld-hint b{color:var(--ld-gold-text);font-weight:600}.ld-controls-bottom .ld-spacer{flex:1}.ld-side{display:flex;flex-direction:column;gap:12px;min-width:0}.ld-side-card{border:1px solid var(--ld-line);background:var(--ld-surface);border-radius:15px;padding:13px 14px}.ld-side-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}.ld-side-head h4{margin:0;font-size:12px;font-weight:650}.ld-side-head span{font-size:10px;color:var(--ld-faint)}.ld-side-head .ld-spacer{flex:1}.ld-odds-hero{display:flex;align-items:baseline;gap:7px;margin-bottom:3px}.ld-odds-hero b{font-size:29px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.02em;line-height:1}.ld-odds-hero span{font-size:11px;color:var(--ld-muted)}.ld-odds-sub{font-size:11px;color:var(--ld-muted);margin-bottom:9px}.ld-odds-sub b{color:inherit;font-weight:600;font-variant-numeric:tabular-nums}.ld-meter{height:6px;border-radius:999px;background:color-mix(in srgb,currentColor 8%,transparent);overflow:hidden;margin-bottom:11px}.ld-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,color-mix(in srgb,#c58a2c 70%,currentColor),color-mix(in srgb,#15803d 65%,currentColor));transition:width .35s}.ld-dist{display:flex;align-items:flex-end;gap:3px;height:54px;padding:4px 0 0;border-bottom:1px solid var(--ld-line);margin-bottom:5px}.ld-dist i{flex:1;min-width:2px;border-radius:3px 3px 0 0;background:color-mix(in srgb,currentColor 16%,transparent);transition:height .3s,background .2s}.ld-dist i.hot{background:color-mix(in srgb,#c58a2c 62%,currentColor)}.ld-dist-axis{display:flex;justify-content:space-between;font-size:9.5px;color:var(--ld-faint);font-variant-numeric:tabular-nums;margin-bottom:10px}.ld-odds-row{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--ld-muted);padding:3px 0;border-bottom:1px dotted var(--ld-line)}.ld-odds-row:last-of-type{border-bottom:0}.ld-odds-row b{color:inherit;font-weight:600;font-variant-numeric:tabular-nums}.ld-suggest{margin-top:10px}.ld-suggest-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ld-faint);margin-bottom:5px}.ld-suggest-list{display:flex;flex-direction:column;gap:4px}.ld-suggest-empty{margin-top:10px;padding:10px 11px;border:1px solid var(--ld-border);border-radius:9px;color:var(--ld-muted);font-size:12px;line-height:1.55}.ld-suggest button{display:flex;align-items:center;gap:7px;width:100%;border:1px solid var(--ld-line);background:var(--ld-surface);color:inherit;border-radius:7px;padding:4px 7px;cursor:pointer;font-size:11px;text-align:left}.ld-suggest button:hover{background:var(--ld-surface-2);border-color:var(--ld-line-strong)}.ld-suggest button span:first-child{font-weight:600;font-variant-numeric:tabular-nums}.ld-suggest button span:last-child{margin-left:auto;color:var(--ld-muted);font-variant-numeric:tabular-nums}.ld-foot{font-size:10.5px;color:var(--ld-faint);margin-top:9px;line-height:1.45}.ld-log{display:flex;flex-direction:column;gap:0;max-height:180px;overflow:auto;margin:-2px -2px 0;padding:2px;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 48px),transparent)}.ld-log-item{display:grid;grid-template-columns:42px 1fr;gap:8px;padding:5px 0;border-bottom:1px dotted var(--ld-line);font-size:11px}.ld-log-item:last-child{border-bottom:0}.ld-log-time{color:var(--ld-faint);font-variant-numeric:tabular-nums;font-size:10px;padding-top:1px}.ld-log-text{line-height:1.45;min-width:0}.ld-log-text b{font-weight:600}.ld-log-text .q{color:var(--ld-gold-text)}.ld-log-text .bad{color:var(--ld-bad)}.ld-log-text .good{color:var(--ld-good)}.ld-log-note{display:block;color:var(--ld-faint);font-style:italic;font-size:10.5px;margin-top:1px}.ld-reveal{border:1px solid color-mix(in srgb,#c58a2c 32%,var(--ld-line));background:radial-gradient(120% 130% at 50% -20%,color-mix(in srgb,#c58a2c 12%,transparent),transparent 60%),var(--ld-surface);border-radius:14px;padding:14px}.ld-reveal-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.ld-reveal-head h4{margin:0;font-size:14px;font-weight:650}.ld-outcome{font-size:11px;padding:2px 9px;border-radius:999px;border:1px solid transparent}.ld-outcome.true{color:var(--ld-good);background:var(--ld-good-soft);border-color:color-mix(in srgb,#15803d 30%,transparent)}.ld-outcome.false{color:var(--ld-bad);background:var(--ld-bad-soft);border-color:color-mix(in srgb,#b91c1c 30%,transparent)}.ld-reveal-sum{font-size:12px;color:var(--ld-muted);margin-bottom:11px}.ld-reveal-sum b{color:inherit;font-weight:600}.ld-hands{display:flex;flex-direction:column;gap:6px;margin-bottom:11px}.ld-hand-row{display:grid;grid-template-columns:80px 1fr auto;gap:9px;align-items:center;border:1px solid var(--ld-line);border-radius:9px;padding:6px 9px;background:color-mix(in srgb,currentColor 2%,transparent)}.ld-hand-row.loser{border-color:color-mix(in srgb,#b91c1c 32%,transparent);background:var(--ld-bad-soft)}.ld-hand-name{font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ld-hand-name span{display:block;font-size:9.5px;color:var(--ld-faint);font-weight:400}.ld-hand-dice.compact{gap:4px;min-height:0;flex-wrap:nowrap}.ld-loser-tag{font-size:10px;color:var(--ld-bad);white-space:nowrap}.ld-referee{border-left:3px solid color-mix(in srgb,#c58a2c 55%,transparent);background:var(--ld-gold-soft);border-radius:0 8px 8px 0;padding:8px 11px;font-size:11.5px;line-height:1.55;margin:10px 0}.ld-referee-head{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--ld-gold-text);margin-bottom:2px;font-weight:600}.ld-referee p{margin:0;color:inherit}.ld-reveal-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.ld-winner{border:1px solid color-mix(in srgb,#c58a2c 30%,var(--ld-line));background:radial-gradient(120% 130% at 50% 0%,color-mix(in srgb,#c58a2c 16%,transparent),transparent 65%),var(--ld-surface);border-radius:16px;padding:22px;text-align:center}.ld-trophy{width:52px;height:52px;border-radius:50%;margin:0 auto 10px;display:grid;place-items:center;font-size:23px;background:var(--ld-gold-soft);border:1px solid color-mix(in srgb,#c58a2c 34%,transparent)}.ld-winner h3{margin:0 0 3px;font-size:21px;font-weight:680}.ld-winner p{margin:0 0 15px;font-size:12px;color:var(--ld-muted)}.ld-standings{display:flex;flex-direction:column;gap:5px;max-width:380px;margin:0 auto 16px;text-align:left}.ld-standing{display:flex;align-items:center;gap:8px;border:1px solid var(--ld-line);border-radius:8px;padding:5px 9px;font-size:11.5px}.ld-standing b{margin-left:auto;font-weight:600;font-variant-numeric:tabular-nums}.ld-replay{display:grid;grid-template-columns:210px minmax(0,1fr);gap:16px;align-items:start}.ld-replay-list{display:flex;flex-direction:column;gap:5px;max-height:520px;overflow:auto;padding-right:2px}.ld-round-btn{border:1px solid var(--ld-line);background:var(--ld-surface);color:inherit;border-radius:9px;padding:7px 9px;cursor:pointer;text-align:left;font-size:11.5px}.ld-round-btn:hover{background:var(--ld-surface-2)}.ld-round-btn[aria-pressed=\"true\"]{border-color:color-mix(in srgb,#c58a2c 55%,transparent);background:var(--ld-gold-soft)}.ld-round-btn b{display:block;font-size:12px;font-weight:600}.ld-round-btn span{color:var(--ld-muted);font-size:10.5px}.ld-replay-detail{min-width:0}.ld-replay-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:10px}.ld-replay-head h3{margin:0;font-size:15px;font-weight:650}.ld-replay-head span{font-size:11px;color:var(--ld-muted)}.ld-replay-dice{display:flex;flex-direction:column;gap:5px;margin:10px 0 13px}.ld-replay-hand{display:grid;grid-template-columns:70px 1fr auto;gap:8px;align-items:center;border:1px solid var(--ld-line);border-radius:8px;padding:5px 8px}.ld-replay-hand.loser{border-color:color-mix(in srgb,#b91c1c 32%,transparent);background:var(--ld-bad-soft)}.ld-replay-hand span{font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ld-replay-result{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid var(--ld-line);border-radius:9px;padding:7px 10px;background:var(--ld-surface);font-size:11.5px;margin:10px 0 0}.ld-replay-result b{margin-left:auto;font-weight:600;color:var(--ld-bad)}.ld-replay-dice .ld-hand-dice{gap:4px;min-height:0}.ld-replay-events{display:flex;flex-direction:column;gap:0}.ld-replay-event{display:grid;grid-template-columns:34px 1fr auto;gap:8px;padding:6px 0;border-bottom:1px dotted var(--ld-line);font-size:11.5px;align-items:baseline}.ld-replay-event:last-child{border-bottom:0}.ld-replay-event .seq{font-size:10px;color:var(--ld-faint);font-variant-numeric:tabular-nums}.ld-replay-event .when{font-size:9.5px;color:var(--ld-faint);font-variant-numeric:tabular-nums}.ld-replay-empty{color:var(--ld-muted);font-size:12px;padding:10px 0}.ld-replay-note{font-size:10.5px;color:var(--ld-faint);border-top:1px solid var(--ld-line);margin-top:12px;padding-top:9px}.ld-loading{display:flex;align-items:center;gap:9px;padding:18px;color:var(--ld-muted);font-size:12px}.ld-spin{width:14px;height:14px;border-radius:50%;border:2px solid var(--ld-line-strong);border-top-color:var(--ld-gold);animation:ld-spin .8s linear infinite}@keyframes ld-spin{to{transform:rotate(360deg)}}.ld-empty{padding:26px 16px;text-align:center;color:var(--ld-muted);font-size:12px}.ld-empty b{display:block;color:inherit;font-size:14px;font-weight:600;margin-bottom:3px}.ld-die{--ld-pip:calc(var(--die-size,36px) * .085);width:var(--die-size,36px);height:var(--die-size,36px);flex:0 0 auto;border-radius:calc(var(--die-size,36px) * .19);background:linear-gradient(145deg,#fffdf6,#eee4d0);color:#241d12;display:grid;place-items:center;position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -1px 0 rgba(80,60,20,.12),0 3px 8px rgba(20,15,5,.16);transition:transform .18s}.ld-die::after{content:\"\";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(36,29,18,.07);pointer-events:none}.ld-pips{width:68%;height:68%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);place-items:center;gap:1px}.ld-pips i{display:block;width:var(--ld-pip);height:var(--ld-pip);border-radius:50%;background:currentColor;opacity:0;transform:scale(.5)}.ld-pips i.on{opacity:1;transform:scale(1)}.ld-die.one{color:#a85f05}.ld-die.back{background:linear-gradient(145deg,#453c2b,#241f16);color:#caa45c;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 3px 8px rgba(20,15,5,.2)}.ld-die.back .ld-pips i{opacity:0}.ld-die.back::before{content:\"?\";position:absolute;font-size:calc(var(--die-size,36px) * .34);font-weight:600;opacity:.5}.ld-die.small{--die-size:22px}.ld-die.tiny{--die-size:16px}.ld-die.glow{box-shadow:0 0 0 2px color-mix(in srgb,#c58a2c 24%,transparent),0 3px 8px rgba(20,15,5,.16)}@media (max-width:960px){.ld-setup{grid-template-columns:1fr}.ld-game{grid-template-columns:1fr}.ld-side{display:grid;grid-template-columns:1fr 1fr}.ld-replay{grid-template-columns:1fr}.ld-replay-list{flex-direction:row;overflow-x:auto;max-height:none}.ld-round-btn{min-width:148px}.ld-hero-dice{display:none}}@media (max-width:640px){.ld-root{padding:14px 12px 24px;gap:14px}.ld-side{grid-template-columns:1fr}.ld-actions{width:100%;margin-left:0}.ld-brand-text p{white-space:normal}.ld-hero h2{font-size:21px}.ld-seat-row{grid-template-columns:20px minmax(0,1fr) auto 26px}.ld-hand-row{grid-template-columns:66px 1fr auto}.ld-controls-top{gap:12px}.ld-felt{padding:16px 12px}.ld-bid-num{font-size:34px}.ld-table-card{padding:10px}}@media (prefers-reduced-motion:reduce){.ld-pulse,.ld-spin{animation:none}.ld-die,.ld-dist i,.ld-meter i,.ld-seat{transition:none}}"

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
    return module.exports;
  },
});

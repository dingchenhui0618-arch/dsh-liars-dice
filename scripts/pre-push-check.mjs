#!/usr/bin/env node
// The three checks required before pushing this repository:
//
//   1. secrets / credentials in any tracked text file
//   2. the .gitignore still covers the things that must never be committed
//   3. no debug scripts, logs, preview harnesses or oversized binary junk
//
// It is deliberately dependency-free and scans the working tree, so it also
// works before `git init`. Run it with `npm run prepush:check`.

import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_DIRS = new Set(['.git', 'node_modules', '_preview', '.npm-cache', 'coverage'])
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp',
  '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.mov', '.zip', '.gz',
])

const SECRET_RULES = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ['OpenAI-style key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['connection string with credentials', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@/]+:[^\s@/]+@/i],
  ['credential-shaped assignment', /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password)\b\s*[:=]\s*['"][^'"\s]{12,}['"]/i],
]

const REQUIRED_IGNORES = [
  ['environment files', '.env'],
  ['npm auth config', '.npmrc'],
  ['dependency directory', 'node_modules'],
  ['local preview harness', '_preview'],
  ['private keys', '*.pem'],
  ['logs', '*.log'],
]

const TRASH_NAMES = [
  /^_debug/i,
  /\.tmp$/i,
  /\.temp$/i,
  /\.log$/i,
  /\.bak$/i,
  /\.orig$/i,
  /\.rej$/i,
  /^\.DS_Store$/i,
  /^Thumbs\.db$/i,
  /^\.npmrc$/i,
  /^\.env(?:\.|$)/i,
]

const OVERSIZE_BYTES = 8 * 1024 * 1024
const hits = []

function hit(check, file, detail) {
  hits.push({ check, file, detail })
}

async function walk(dir, out) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walk(join(dir, entry.name), out)
    } else if (entry.isFile()) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

const files = await walk(root, [])
const textFiles = []
for (const file of files) {
  const name = relative(root, file)
  const ext = extname(name).toLowerCase()
  const info = await stat(file)
  if (TRASH_NAMES.some((pattern) => pattern.test(name))) {
    hit('temp/unrelated', name, 'debug, log, backup or local credential file')
  }
  if (info.size > OVERSIZE_BYTES && !BINARY_EXTS.has(ext)) {
    hit('temp/unrelated', name, 'text file larger than 8 MiB')
  }
  if (BINARY_EXTS.has(ext)) continue
  const buffer = await readFile(file)
  if (buffer.includes(0)) continue
  textFiles.push({ file, name, text: buffer.toString('utf8') })
}

// 1. secrets
for (const entry of textFiles) {
  const lines = entry.text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    for (const [label, pattern] of SECRET_RULES) {
      if (pattern.test(lines[index])) {
        hit('secrets', entry.name + ':' + (index + 1), label)
      }
    }
  }
  if (/^\.env(?:\.|$)/i.test(entry.name) || /^\.npmrc$/i.test(entry.name)) {
    hit('secrets', entry.name, 'credential file is not ignored')
  }
}

// 2. .gitignore coverage
const ignoreText = await readFile(join(root, '.gitignore'), 'utf8')
const ignoreLines = ignoreText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
for (const [label, needed] of REQUIRED_IGNORES) {
  const found = ignoreLines.some((line) => {
    const clean = line.replace(/^!/, '').replace(/\/$/, '')
    return clean === needed || clean === needed.replace(/\*\./, '') || line === needed
  })
  if (!found) hit('gitignore', '.gitignore', 'missing ' + label + ' (' + needed + ')')
}

// 3. repo surface: only expected top-level entries, and no generated previews
const allowedTop = new Set([
  '.git', '.gitattributes', '.github', '.gitignore', 'CHANGELOG.md', 'LICENSE',
  'README.md', 'SECURITY.md', 'cordis.patch.yml', 'docs', 'lib', 'node_modules',
  'package.json', 'scripts', 'screenshots.json', 'src', 'test', '_preview',
])
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!allowedTop.has(entry.name)) {
    hit('temp/unrelated', entry.name, 'unexpected top-level file or directory')
  }
}
for (const entry of textFiles) {
  if (/^docs\/preview-|^docs\/.*\.tmp\.png$/i.test(entry.name)) {
    hit('temp/unrelated', entry.name, 'preview-only artifact in docs/')
  }
}

const report = [
  ['secrets', 'Secret scan'],
  ['gitignore', '.gitignore review'],
  ['temp/unrelated', 'Temp / unrelated files'],
]

let failed = false
for (const [key, label] of report) {
  const group = hits.filter((item) => item.check === key)
  if (group.length === 0) {
    console.log('PASS  ' + label)
    continue
  }
  failed = true
  console.log('FAIL  ' + label)
  for (const item of group) console.log('      ' + item.file + ' — ' + item.detail)
}
console.log('')
console.log('scanned ' + textFiles.length + ' text files under ' + root)
if (failed) {
  console.error('Do not push until every FAIL above is fixed.')
  process.exitCode = 1
}

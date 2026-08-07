#!/usr/bin/env node
/**
 * dev-standards — vendor the org's shared skills and tooling into a project.
 *
 * The shared files are COPIED into the consumer repo rather than referenced, because a
 * clone must work with zero setup: Claude Code discovers skills from files on disk, and a
 * colleague who has to remember `git submodule update` will one day not remember. The
 * copy's provenance is recorded in `.dev-standards.json` — source, version and a hash per
 * file — so drift is detectable instead of invisible.
 *
 *   npx github:entercloud-cz/dev-standards init        # provision a NEW project (or adopt)
 *   npx github:entercloud-cz/dev-standards install     # vendor into an existing project
 *   npx github:entercloud-cz/dev-standards update      # after a new release
 *   npx github:entercloud-cz/dev-standards check       # CI: vendored copy still pristine?
 *   npx github:entercloud-cz/dev-standards list        # what this version provides
 *
 * Pin a version by pinning the fetch: `npx github:entercloud-cz/dev-standards#v1.2.0 update`.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = process.cwd();
const MANIFEST = join(PROJECT, '.dev-standards.json');
const VERSION = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version;
const SOURCE = 'entercloud-cz/dev-standards';

// What gets vendored, and where it lands in the consumer. Skills must sit under
// .claude/skills/<name>/ for Claude Code to discover them; the scripts keep their
// relative import of ./lib/config.mjs, so scripts/ is copied as one unit.
const PAYLOAD = [
  { from: 'skills', to: '.claude/skills' },
  { from: 'scripts', to: 'scripts' },
];

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

// Dotted-numeric compare, enough for this repo's x.y.z tags: true when a > b.
const newerThan = (a, b) => {
  const [pa, pb] = [a, b].map((v) => String(v).split('.').map(Number));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
};

function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, base));
    else out.push(relative(base, p));
  }
  return out;
}

/** Every payload file as { src (absolute), dest (project-relative) }. */
function payloadFiles() {
  const files = [];
  for (const { from, to } of PAYLOAD) {
    const abs = join(PKG_ROOT, from);
    if (!existsSync(abs)) continue;
    for (const rel of walk(abs)) {
      files.push({ src: join(abs, rel), dest: join(to, rel).split('\\').join('/') });
    }
  }
  return files.sort((a, b) => a.dest.localeCompare(b.dest));
}

function readManifest() {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : null;
}

// ── install / update ─────────────────────────────────────────────────────────
function vendor(cmd) {
  const previous = readManifest();
  if (cmd === 'update' && !previous) {
    console.error(`No ${relative(PROJECT, MANIFEST)} — run \`install\` first.`);
    process.exit(1);
  }

  // Preflight: never destroy local edits silently. With a manifest, "locally modified"
  // means the target's hash differs from the recorded one; on a first install (no
  // manifest), any existing target with different content is suspect. Either way the
  // overwrite must be deliberate: --force.
  const FORCE = process.argv.includes('--force');
  const dirty = [];
  for (const { src, dest } of payloadFiles()) {
    const target = join(PROJECT, dest);
    if (!existsSync(target)) continue;
    const cur = readFileSync(target);
    if (cur.equals(readFileSync(src))) continue;
    if (!previous?.vendored?.[dest] || sha(cur) !== previous.vendored[dest]) dirty.push(dest);
  }
  if (dirty.length && !FORCE) {
    console.error(`Refusing to overwrite ${dirty.length} locally modified file(s):\n`);
    for (const d of dirty) console.error(`  ${d}`);
    console.error(`\nThese differ from what this project vendored. Send the change upstream or discard`);
    console.error(`it, then re-run — or re-run with --force to overwrite deliberately.`);
    process.exit(1);
  }

  const vendored = {};
  let written = 0, unchanged = 0;
  for (const { src, dest } of payloadFiles()) {
    const buf = readFileSync(src);
    const target = join(PROJECT, dest);
    const existed = existsSync(target);
    const same = existed && readFileSync(target).equals(buf);
    if (!same) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, buf);
      written++;
      console.log(`  ${existed ? 'updated' : 'added  '} ${dest}`);
    } else {
      unchanged++;
    }
    vendored[dest] = sha(buf);
  }

  // Files this project vendored from an older version that no longer exist upstream.
  const removed = Object.keys(previous?.vendored || {}).filter((f) => !(f in vendored));
  if (removed.length) {
    console.log('\nNo longer part of dev-standards (delete them by hand if unused):');
    for (const f of removed) console.log(`  removed upstream: ${f}`);
  }

  writeFileSync(MANIFEST, JSON.stringify({
    $comment: 'Vendored from the org standards repo. Do NOT edit the vendored files here — '
      + 'send the change upstream and re-run update, or `check` will fail in CI. '
      + 'The issueFlow block below IS yours to edit.',
    source: SOURCE,
    version: VERSION,
    installedAt: new Date().toISOString().slice(0, 10),
    vendored,
    // Preserved across updates — this is the project's own configuration.
    issueFlow: previous?.issueFlow || {
      repo: 'ORG/REPO',
      manifest: 'docs/issues-seed.json',
      workDocument: 'docs/BACKLOG.md',
      owners: {},
      defaultFirstLane: null,
      labels: {},
    },
  }, null, 2) + '\n');

  console.log(`\n${cmd === 'install' ? 'Installed' : 'Updated to'} ${SOURCE}@${VERSION}`
    + ` — ${written} file(s) written, ${unchanged} already current.`);
  if (!previous) {
    console.log(`\nNext: fill in the \`issueFlow\` block of .dev-standards.json (repo, owners),`);
    console.log(`and add a "dev-standards check" step to CI so drift cannot pass silently.`);
  }
}

// ── check ────────────────────────────────────────────────────────────────────
// Local only, no network: recompute the hashes and compare. Catches the failure that
// matters — someone edited a shared skill in the consumer, where the edit will be
// silently overwritten by the next update and never reaches the other repos.
function check() {
  const m = readManifest();
  if (!m) {
    console.error(`No .dev-standards.json — this project does not vendor ${SOURCE}.`);
    process.exit(1);
  }
  const problems = [];
  for (const [dest, expected] of Object.entries(m.vendored || {})) {
    const target = join(PROJECT, dest);
    if (!existsSync(target)) { problems.push(`MISSING  ${dest}`); continue; }
    if (sha(readFileSync(target)) !== expected) problems.push(`MODIFIED ${dest}`);
  }
  if (problems.length) {
    console.error(`Vendored files differ from the manifest pinned to ${m.source}@${m.version}:\n`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(`\nThese files are owned by ${m.source}. Send the change upstream, release,`);
    console.error(`then run: npx github:${SOURCE} update`);
    console.error(`(If a file was deleted on purpose, run update to re-record the manifest.)`);
    process.exit(1);
  }
  console.log(`Vendored files match the manifest pinned to ${m.source}@${m.version} `
    + `(${Object.keys(m.vendored).length} files).`);
  if (m.version !== VERSION) {
    console.log(`Note: this CLI is ${VERSION}; the project pins ${m.version}. `
      + `Run \`update\` to move.`);
    // In CI the unpinned npx fetch makes VERSION the latest release, so a mismatch in
    // this direction means an update is available. Surface it where someone actually
    // looks — a yellow annotation and the job summary — while the step stays green:
    // updating is deliberate (CLAUDE.md → decisions), and `check` itself stays offline.
    // The reverse direction (a pinned, older CLI checking a newer project) stays quiet.
    if (newerThan(VERSION, m.version) && process.env.GITHUB_ACTIONS === 'true') {
      const note = `dev-standards ${VERSION} is available — this project pins ${m.version}. `
        + `Run: npx github:${SOURCE} update`;
      console.log(`::warning title=dev-standards update available::${note}`);
      if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, `> ⚠️ ${note}\n`);
      }
    }
  }
}

function list() {
  console.log(`${SOURCE}@${VERSION} provides:\n`);
  for (const { dest } of payloadFiles()) console.log(`  ${dest}`);
}

// ── init ─────────────────────────────────────────────────────────────────────
// Provision a new project: git, the vendored standards, and starter files from
// templates/. Starters are written ONLY where absent and belong to the project from
// then on (never in PAYLOAD, never drift-checked) — which also makes init the safe way
// to adopt the standards into an existing repository.
function init() {
  if (!existsSync(join(PROJECT, '.git'))) {
    // -b main: the starter workflow triggers on main, so the default branch must match.
    execFileSync('git', ['init', '-b', 'main'], { stdio: 'inherit' });
  }

  vendor(existsSync(MANIFEST) ? 'update' : 'install');

  const project = basename(PROJECT);
  const tplRoot = join(PKG_ROOT, 'templates');
  console.log('');
  let kept = 0;
  for (const rel of walk(tplRoot)) {
    const target = join(PROJECT, rel);
    if (existsSync(target)) { kept++; continue; }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join(tplRoot, rel), 'utf8').split('{{PROJECT}}').join(project));
    console.log(`  started ${rel}`);
  }
  if (kept) console.log(`  (${kept} starter file(s) already existed — left untouched)`);

  console.log(`\nProject '${project}' provisioned. The starter files are YOURS to edit —`
    + ` only .claude/skills/ and scripts/ stay owned by ${SOURCE}.`);
  console.log(`\nNext steps:`);
  console.log(`  1. Fill the TODOs in CLAUDE.md and the issueFlow block of .dev-standards.json (repo, owners).`);
  console.log(`  2. Create and push the GitHub repository, e.g.:`);
  console.log(`       gh repo create <org>/${project} --private --source=. --push`);
  console.log(`  3. Seed the labels: node scripts/seed-issues.mjs`);
  console.log(`  4. RESTART the Claude Code session — a first-time .claude/skills/ needs one to be discovered.`);
  console.log(`  5. Start with the app-design skill: it creates the document set this repo does not have yet.`);
}

const cmd = process.argv[2];
if (cmd === 'install' || cmd === 'update') vendor(cmd);
else if (cmd === 'init') init();
else if (cmd === 'check') check();
else if (cmd === 'list') list();
else {
  console.log('Usage: dev-standards <init|install|update|check|list>');
  process.exit(cmd ? 1 : 0);
}

#!/usr/bin/env node
/**
 * Seed GitHub labels, milestones and issues from the project's issue manifest.
 *
 * IDEMPOTENT BY DESIGN: it reads what already exists and creates only what is
 * missing (issues are matched on the exact title). Re-running is therefore safe
 * and is how you promote a low-priority item out of the reserve later — add a row to the
 * manifest and run this again.
 *
 * Lanes: every issue carries a `track/<lane>` label, so `gh issue list --assignee @me`
 * is a person's queue and `-l track/<lane>` is a whole lane. The lane names, their
 * owners and the file-ownership map are the PROJECT's — see .dev-standards.json and the
 * project's agent file.
 *
 *   node scripts/seed-issues.mjs --dry-run     # print the plan, touch nothing
 *   node scripts/seed-issues.mjs               # create what is missing
 *   node scripts/seed-issues.mjs --only=slug-a,slug-b
 *
 * Requires: gh CLI, authenticated with `repo` scope (labels + issues).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Project specifics come from .dev-standards.json — see lib/config.mjs. This script
// carries no repo slug, path or username, so it works in any repo that has that file.
import { issueFlowConfig } from './lib/config.mjs';
const ROOT = process.cwd();
const CFG = issueFlowConfig(ROOT);
const MANIFEST = join(ROOT, CFG.manifest);
const REPO = CFG.repo;

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').slice('--only='.length)
  .split(',').map((s) => s.trim()).filter(Boolean);

const gh = (gArgs, { json = false } = {}) => {
  const out = execFileSync('gh', gArgs, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return json ? JSON.parse(out || '[]') : out.trim();
};

function step(action, what) {
  console.log(`${DRY ? '[dry-run] would ' : ''}${action}: ${what}`);
}

// ── Issue body ───────────────────────────────────────────────────────────────
// Fixed skeleton so every lane reads the same shape: why it matters, what "done"
// means, and which files it will touch (with the owning lane, because that is what
// decides who may edit them).
function renderBody(i) {
  const done = (i.done && i.done.length ? i.done : ['_TODO: write verifiable acceptance criteria (promoted from the reserve)._'])
    .map((d) => (d.startsWith('_') ? d : `- [ ] ${d}`)).join('\n');
  const needs = i.needs
    ? `\n**Needs first:** the \`${i.needs}\` lane — that half must land before the other side can finish.\n`
    : '';
  return `**Source:** ${i.source}
**Why it matters:** ${i.why}
${needs}
**Done when:**
${done}

**Likely files:** ${i.files || '_TODO — see the source section._'}

<sub>Seeded from \`${CFG.manifest}\` (slug: \`${i.slug}\`). Branch: \`${i.track === 'both' ? Object.keys(CFG.owners).join('|') || 'lane' : i.track}/${i.slug}\`. The reasoning behind this item lives in ${i.source.split(' ')[0]}.</sub>`;
}

const labelsFor = (i) => [
  `track/${i.track}`,
  i.priority,
  `size/${i.size}`,
  ...(i.areas || []).map((a) => `area/${a}`),
  ...(i.needs ? [`needs/${i.needs}`] : []),
];

// Every issue gets an owner at creation where the project names one: an unassigned issue
// means "what am I working on" has no answer GitHub can give. A cross-lane item goes to
// whoever must go FIRST, named by its needs/* value (or the configured default).
// Lanes with no configured owner simply create the issue unassigned.
const OWNERS = CFG.owners;
const assigneeFor = (i) => {
  if (i.assignee) return i.assignee;
  const lane = i.track === 'both' ? (i.needs || CFG.defaultFirstLane) : i.track;
  return (lane && OWNERS[lane]) || null;
};

// ── Main ─────────────────────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const reserve = manifest.reserve || [];
// A default run seeds only `issues`. `--only` ALSO reaches into the reserve, so promoting
// a low-priority item is one command — that reserve is the whole point of keeping
// low-priority work as structured data instead of prose nobody re-reads.
const pool = [...manifest.issues, ...reserve];
const issues = ONLY.length ? pool.filter((i) => ONLY.includes(i.slug)) : manifest.issues;
if (ONLY.length && issues.length !== ONLY.length) {
  const missing = ONLY.filter((s) => !pool.some((i) => i.slug === s));
  console.error(`Unknown slug(s): ${missing.join(', ')}`);
  process.exit(1);
}
for (const i of issues) {
  if (reserve.includes(i)) {
    console.log(`Note: '${i.slug}' comes from the reserve — it has no acceptance criteria yet.`);
    console.log('      Write "Done when" into the issue after creating it, and move the entry into `issues`.');
  }
}

console.log(`Repo: ${REPO}${DRY ? '  (DRY RUN — nothing will be created)' : ''}`);

// 1) Labels
const existingLabels = new Set(gh(['label', 'list', '-R', REPO, '--limit', '200', '--json', 'name'], { json: true }).map((l) => l.name));
let createdLabels = 0;
for (const l of manifest.labels) {
  if (existingLabels.has(l.name)) continue;
  step('create label', l.name);
  if (!DRY) gh(['label', 'create', l.name, '-R', REPO, '--color', l.color, '--description', l.description]);
  createdLabels++;
}

// 2) Milestones — gh has no `milestone` command; use the REST API.
const existingMilestones = new Map(
  gh(['api', `repos/${REPO}/milestones?state=all&per_page=100`], { json: true }).map((m) => [m.title, m.number])
);
let createdMilestones = 0;
for (const m of manifest.milestones) {
  if (existingMilestones.has(m.title)) continue;
  step('create milestone', m.title);
  if (!DRY) {
    const created = JSON.parse(execFileSync('gh', [
      'api', `repos/${REPO}/milestones`, '-X', 'POST',
      '-f', `title=${m.title}`, '-f', `description=${m.description}`,
    ], { encoding: 'utf8' }));
    existingMilestones.set(m.title, created.number);
  }
  createdMilestones++;
}

// 3) Issues — matched on the exact title, so re-running never duplicates.
const existingIssues = new Map(
  gh(['issue', 'list', '-R', REPO, '--state', 'all', '--limit', '500', '--json', 'number,title'], { json: true })
    .map((i) => [i.title, i.number])
);
let createdIssues = 0, skipped = 0;
for (const i of issues) {
  if (existingIssues.has(i.title)) { skipped++; continue; }
  const labels = labelsFor(i);
  step('create issue', `[${i.track}/${i.priority}] ${i.title}`);
  if (!DRY) {
    const a = ['issue', 'create', '-R', REPO, '--title', i.title, '--body', renderBody(i)];
    for (const l of labels) a.push('--label', l);
    if (i.milestone) a.push('--milestone', i.milestone);
    const owner = assigneeFor(i);
    if (owner) a.push('--assignee', owner);
    const url = gh(a);
    console.log(`   → ${url}${owner ? `  (@${owner})` : ''}`);
  } else {
    console.log(`   labels: ${labels.join(', ')}${i.milestone ? ` · milestone: ${i.milestone}` : ''}`
      + `${assigneeFor(i) ? ` · @${assigneeFor(i)}` : ''}`);
  }
  createdIssues++;
}

console.log(`\nLabels created: ${createdLabels} (${manifest.labels.length - createdLabels} already present)`);
console.log(`Milestones created: ${createdMilestones} (${manifest.milestones.length - createdMilestones} already present)`);
console.log(`Issues created: ${createdIssues}, already present: ${skipped}, total in manifest: ${issues.length}`);
if (DRY) console.log('\nDry run — nothing was created. Re-run without --dry-run to apply.');

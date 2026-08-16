/**
 * Read a consumer project's dev-standards configuration.
 *
 * Everything project-specific lives in `.dev-standards.json` at the repo root, so the
 * shared scripts carry no repo slug, path or username. A missing or incomplete config is
 * an explicit error rather than a silent default: guessing the tracker repo would file
 * issues somewhere unexpected.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const CONFIG_FILE = '.dev-standards.json';

export function loadConfig(root = process.cwd()) {
  const path = join(root, CONFIG_FILE);
  if (!existsSync(path)) {
    throw new Error(`${CONFIG_FILE} not found in ${root}. Run: npx github:entercloud-cz/dev-standards install`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * A lane is configured either as a bare username or as an object naming an owner and the
 * people who also work there. Both forms are read here and NOWHERE else: what leaves this
 * function is always `owners[lane] = username | null` and `contributors[lane] = [...]`, so
 * no caller ever handles two shapes. The bare string is the original form and keeps meaning
 * "owner, no contributors" for ever — an `update` preserves a project's issueFlow block, so
 * configs written before contributors existed stay in the wild indefinitely.
 *
 * A lane with contributors but no owner is legitimate: it registers the lane and files its
 * issues unassigned. Key order is preserved, because it is the lane order of the index.
 */
function normaliseOwners(raw) {
  const owners = {}, contributors = {};
  for (const [lane, value] of Object.entries(raw || {})) {
    const isObject = value && typeof value === 'object' && !Array.isArray(value);
    owners[lane] = (isObject ? value.owner : value) || null;
    contributors[lane] = isObject && Array.isArray(value.contributors) ? value.contributors : [];
  }
  return { owners, contributors };
}

/** The `issueFlow` section, validated. Env vars win so CI can override without a commit. */
export function issueFlowConfig(root = process.cwd()) {
  const cfg = loadConfig(root).issueFlow || {};
  const { owners, contributors } = normaliseOwners(cfg.owners);
  const out = {
    repo: process.env.DEV_STANDARDS_REPO || cfg.repo,
    manifest: cfg.manifest || 'docs/issues-seed.json',
    workDocument: cfg.workDocument || 'docs/BACKLOG.md',
    // lane → GitHub username (or null). Used to assign an issue at creation; a lane with no
    // owner simply creates the issue unassigned rather than failing.
    owners,
    // lane → the people who also work there. Nothing here reads this to decide anything:
    // assignment stays single, because "what am I working on" has to have one answer.
    // It is the canonical note of who works a lane, and what a CODEOWNERS file is kept
    // in step with by hand.
    contributors,
    // The track name meaning "this item spans lanes". Configurable because a project that
    // has three lanes cannot call the cross-lane one `both` and still be understood; the
    // default keeps every existing project unchanged.
    crossLaneLabel: cfg.crossLaneLabel || 'both',
    // For cross-lane items: which lane goes first when the item does not say.
    defaultFirstLane: cfg.defaultFirstLane || null,
    // Label vocabulary the scripts must recognise. `priorities` is ordered most-urgent
    // first; P0/P1/P2 is a conventional default, and a project that names its priority
    // labels differently overrides it here — the scripts never assume the P scheme.
    labels: { priorities: ['P0', 'P1', 'P2'], ...(cfg.labels || {}) },
  };
  if (out.repo === 'ORG/REPO') {
    throw new Error(`issueFlow.repo in ${CONFIG_FILE} is still the install placeholder — set it to the project's tracker repo`);
  }
  if (!out.repo) {
    throw new Error(`issueFlow.repo is required in ${CONFIG_FILE} (e.g. "org/repo")`);
  }
  return out;
}

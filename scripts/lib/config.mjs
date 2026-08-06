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

/** The `issueFlow` section, validated. Env vars win so CI can override without a commit. */
export function issueFlowConfig(root = process.cwd()) {
  const cfg = loadConfig(root).issueFlow || {};
  const out = {
    repo: process.env.DEV_STANDARDS_REPO || cfg.repo,
    manifest: cfg.manifest || 'docs/issues-seed.json',
    workDocument: cfg.workDocument || 'docs/BACKLOG.md',
    // lane → GitHub username. Used to assign an issue at creation; a lane with no owner
    // simply creates the issue unassigned rather than failing.
    owners: cfg.owners || {},
    // For cross-lane items: which lane goes first when the item does not say.
    defaultFirstLane: cfg.defaultFirstLane || null,
    labels: cfg.labels || {},
  };
  if (!out.repo) {
    throw new Error(`issueFlow.repo is required in ${CONFIG_FILE} (e.g. "org/repo")`);
  }
  return out;
}

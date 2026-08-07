#!/usr/bin/env node
/**
 * Fixture server for looking at the application's pages in a real browser.
 * REFERENCE SKELETON from dev-standards' browser-check skill: copy it into the project
 * (conventionally test/ui/) and adapt the marked section — the copy is the project's.
 *
 * WHY THIS EXISTS. A plain static server is not enough: the chrome typically asks the
 * API for identity on every init, retries, and ends in an error state — so without an
 * answer every page is an empty shell, not a page.
 *
 * THIS IS A VIEWING HARNESS, NOT A MOCK OF THE API: it must never grow behaviour the
 * real API does not have, or it starts proving things that are not true. When a check
 * needs an endpoint that is not here, add the FIXTURE — do not teach the stub logic,
 * and do not widen the checker's ignore list.
 *
 *   node test/ui/stub-server.mjs                       # default role, port 4173
 *   ROLE=<role> PORT=4300 node test/ui/stub-server.mjs
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Root of the static pages, assuming this file lives two levels below it (test/ui/) —
// adjust if the project keeps it elsewhere; point it at the PAGES directory, not wider
// than needed (everything under it is served, so a repo root serves .env and .git too).
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const PORT = Number(process.env.PORT || 4173);
const ROLE = process.env.ROLE || 'admin'; // adjust the default to the project's role vocabulary

// ── THE PROJECT'S FIXTURES — everything in this section is yours ────────────────────
// Answer exactly what the chrome calls on init, with the REAL endpoint's response
// shape — copy a real response and trim it. Use the identifier formats the real API
// emits (if it identifies things by GUID, a slug here exercises a path the real app
// never takes). ROLE flows in so role-gated pages can be checked from both sides.

// The prefix under which the real API lives — the checker learns it from the
// handshake, so this is the only place it is set.
const API_PREFIX = '/api/';

const IDENTITY = {
  // Replace with the real identity response shape:
  user: { id: 1, email: `${ROLE}@example.test`, displayName: 'Test User', role: ROLE },
};

function apiFixture(url) {
  // Map endpoint → fixture. Watch the browser's network tab (or read the chrome
  // module) to find what init actually calls. Example:
  if (url.pathname === `${API_PREFIX}identity`) return IDENTITY;
  return null;
}
// ── end of the project's section ─────────────────────────────────────────────────────

// Anything unlisted answers 404 with a JSON body naming itself — pages are expected to
// tolerate a 404; a hanging request would masquerade as a page bug.
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Handshake for the checker: proves it talks to THIS harness and this role. Without
  // it, a stale server from another project on the same port makes the checker report
  // nonsense — which is exactly how this line got here.
  if (url.pathname === '/__stub__') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ harness: 'browser-check', root: ROOT, role: ROLE, apiPrefix: API_PREFIX }));
    return;
  }

  if (url.pathname.startsWith(API_PREFIX)) {
    const body = apiFixture(url);
    res.writeHead(body ? 200 : 404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body ?? { error: `no stub fixture for ${url.pathname}${url.search}` }));
    return;
  }

  // Static files, confined to ROOT (a path escaping it is a bug in a test, but it
  // would read the developer's disk — refuse rather than trust the URL). The separator
  // matters: a bare prefix check would accept a SIBLING directory named ROOT + suffix.
  const rel = normalize(decodeURIComponent(url.pathname));
  const file = join(ROOT, rel === '/' ? 'index.html' : rel);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403); res.end('outside the root'); return; }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(PORT, () => {
  console.log(`stub server: http://localhost:${PORT}  (role=${ROLE})`);
});

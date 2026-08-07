#!/usr/bin/env python3
"""
Open the application's pages in a real browser and fail on what static analysis cannot
see: a page that throws on load, chrome that never renders, a role gate facing the
wrong way. REFERENCE SKELETON from dev-standards' browser-check skill: copy it into the
project (conventionally test/ui/) and adapt the marked sections — the copy is yours.

    node test/ui/stub-server.mjs &
    python3 test/ui/check-pages.py                  # all pages, default role
    python3 test/ui/check-pages.py --role member
    python3 test/ui/check-pages.py --page settings.html --headed

Exit code 0 only if every page loaded clean. Needs `pip install playwright` and
`playwright install chromium` — a deliberate, per-machine decision.

DELIBERATELY NOT A MOCK OF THE APP: the stub answers fixtures, so a green run proves a
page initialises, renders its chrome and reacts — NEVER that it shows correct data.
Correct data is a different layer's job, against a real environment.
"""

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]

# ── THE PROJECT'S LISTS AND ASSERTIONS — everything in this section is yours ─────────

# Pages that own their chrome by design, and redirect stubs with nothing to render.
# Keep the reason next to every entry; an entry without a reason is a hidden failure.
SKIP: set[str] = set()

# Console/request noise that is NOT a defect: the stub's own deliberate 404s and the
# favicon. NEVER widen this to make a page pass — every added pattern is a class of
# real failures the check goes blind to. A missing endpoint means: add a fixture.
IGNORE = re.compile(r'no stub fixture|favicon', re.I)

def assert_chrome_rendered(page, problems):
    """Selectors that prove the shared chrome actually RENDERED — not merely that the
    markup declared it, which is all a static test can tell. Replace with the
    project's own (the nav container and one thing only a successful identity call
    produces)."""
    # Example — replace:
    # if page.locator('#app-nav .nav-item').count() == 0:
    #     problems.append('nav rendered no items (identity call never resolved?)')

# Role-gated pages earn a deep check per page — both directions: the privileged role
# sees content and no gate; the unprivileged role sees the gate, never a blank page.
# def check_settings(page, base, role): ...

# ── end of the project's section ─────────────────────────────────────────────────────


def check_page(page, base, name, api_prefix):
    errors, failed_requests, api_404s = [], [], []

    def on_console(m):
        if m.type != 'error':
            return
        url = (m.location or {}).get('url', '')
        if IGNORE.search(m.text) or IGNORE.search(url):
            return
        # Chrome logs every 4xx response as a console error WITHOUT the URL in the
        # text. The stub 404s unfixtured API endpoints by design — collected as
        # diagnostics, not failures; a 404 on a static asset (a missing script, a
        # broken href) is a real defect and stays.
        if 'status of 404' in m.text and api_prefix in url:
            api_404s.append(url)
            return
        errors.append(f'{m.text} ({url})' if url else m.text)

    page.on('console', on_console)
    page.on('pageerror', lambda e: errors.append(f'uncaught: {e}'))
    page.on('requestfailed', lambda r: failed_requests.append(r.url) if not IGNORE.search(r.url) else None)

    # networkidle is a pragmatic wait for a smoke harness against a local stub (fast,
    # page-agnostic); a page's own deep check should wait on concrete assertions
    # instead, which is also what the Playwright docs recommend for real tests.
    page.goto(f'{base}/{name}', wait_until='networkidle')

    problems = []
    if errors:
        problems.append('console/page errors: ' + ' | '.join(errors[:3]))
    if failed_requests:
        problems.append('failed requests: ' + ' | '.join(failed_requests[:3]))
    assert_chrome_rendered(page, problems)
    return problems, api_404s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://localhost:4173')
    ap.add_argument('--role', default='admin', help='must match the ROLE the stub was started with')
    ap.add_argument('--page', help='check one page only')
    ap.add_argument('--headed', action='store_true')
    args = ap.parse_args()

    # Handshake first: a stale server from ANOTHER project on this port — even another
    # project's copy of this very harness — would serve its own pages and fixtures, and
    # every result below would be nonsense with a straight face. Same for a role
    # mismatch: the deep checks assert against args.role. Exit 3 = harness problem,
    # exit 2 = pages failed.
    try:
        with urllib.request.urlopen(f'{args.base}/__stub__', timeout=5) as r:
            hello = json.load(r)
    except urllib.error.HTTPError as e:
        print(f'{args.base} answered HTTP {e.code} to the handshake — another server owns the port')
        return 3
    except Exception as e:
        print(f'nothing answering at {args.base} ({e}) — start the stub server first')
        return 3
    if hello.get('harness') != 'browser-check':
        print(f'{args.base} is serving something, but not this harness — another server owns the port')
        return 3
    if Path(hello.get('root', '')).resolve() != ROOT:
        print(f"the stub serves a different repo ({hello.get('root')}) — another project's harness owns the port")
        return 3
    if hello.get('role') != args.role:
        print(f"stub runs as role '{hello.get('role')}' but the check asked for '{args.role}' — restart the stub with ROLE={args.role}")
        return 3
    api_prefix = hello.get('apiPrefix', '/api/')

    # File-per-page apps: every *.html at the root. An app with routes instead of files
    # replaces this with its route list — the one thing this loop needs is names.
    pages = [args.page] if args.page else sorted(
        p.name for p in ROOT.glob('*.html') if p.name not in SKIP)
    if not pages:
        print('no pages found — adjust ROOT or the page list for this project')
        return 2

    failures = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.headed)
        for name in pages:
            page = browser.new_page()
            try:
                problems, api_404s = check_page(page, args.base, name, api_prefix)
                # Per-page deep checks plug in here, e.g.:
                # if name == 'settings.html':
                #     problems += check_settings(page, args.base, args.role)
                if problems:
                    failures += 1
                    print(f'FAIL  {name}')
                    for p in problems:
                        print(f'        {p}')
                    for u in api_404s:
                        print(f'        (stub answered 404 by design: {u} — if the page needs it, add a fixture)')
                else:
                    print(f'ok    {name}')
            except Exception as e:  # a page that hangs or crashes the driver is a failure
                failures += 1
                print(f'FAIL  {name}\n        {type(e).__name__}: {e}')
            finally:
                page.close()
        browser.close()

    print(f'\n{len(pages) - failures}/{len(pages)} pages clean as {args.role}.')
    return 2 if failures else 0


if __name__ == '__main__':
    sys.exit(main())

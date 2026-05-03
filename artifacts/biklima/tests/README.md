# biklima e2e tests

Playwright-based end-to-end suite for the biklima learner journey.

See `artifacts/biklima/docs/qa-report.md` → "End-to-end Playwright
suite" for the full description (what it covers, fixtures, seed
data, caveats).

## Quick start

```bash
# from the repo root
pnpm test
# or scoped to the biklima artifact
pnpm --filter @workspace/biklima test
```

Requires the `artifacts/api-server` and `artifacts/biklima`
workflows to be running. Override the proxy URL with
`E2E_BASE_URL=http://example` if needed.

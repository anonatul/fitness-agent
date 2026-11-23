# Checkpoint 6 — Evaluation Report

## Totals

| Suite | Checks | Passed | Failed |
|---|---:|---:|---:|
| Deterministic scenario/tool/invariant evaluation (`npm run test:eval`) | 58 | 58 | 0 |
| Live LLM evaluation (`npm run test:llm`, 10 prompts) | 61 | 61 | 0 |
| Tool-loop limit (`npm run test:loop`) | 1 | 1 | 0 |
| Checkpoint 3 context checks | all | passed | 0 |
| Checkpoint 4 tool checks | all | passed | 0 |
| Checkpoint 5 training checks | all | passed | 0 |
| Build / typecheck / `/health` / validation | all | passed | 0 |

The live LLM run required one retry of L10 after a transient `fetch failed`; all behavioral assertions then passed.

## Fixed during evaluation

1. **"Knee hurts" was not classified as a pain red flag** (critical safety gap). Added a joint + `hurts/aching/sore` pattern to `safetyEvaluator`. Regression: scenario S15.
2. **CLARIFY decisions still carried a training session** (contradictory decision object). CLARIFY now has no session and adds a logging-only modification.
3. **`tools:check` leaked an orphan athlete** when run through `test:all` without `ATHLETE_ID`. The npm script now pins the test athlete id.
4. Evaluation-harness bugs only: non-global regex passed to `matchAll`, DB-failure probe overriding env after imports, and one over-strict expectation for the 20-minute scenario.

## Critical failures remaining

None found.

## Non-critical limitations

- Intent classification is deterministic keyword rules rather than LLM interpretation; ambiguous text falls back to CLARIFICATION.
- Readiness is heuristic; resting HR has no baseline trend yet.
- Session selection infers program blocks from logged exercise names (the schema has no explicit Strength A/B/C label).
- No persistent progression or phase writes by design.
- Live requests take ~50–110s with full context; no retry/backoff for transient provider errors.
- Output formatting is checked for required section headings, not prose quality.

## Fixtures

All fixtures in `tests/fixtures/` are synthetic (no personal data, no API keys). Live evaluation seeds a temporary athlete, then deletes it; the database is empty after every suite.

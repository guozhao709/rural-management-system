# Health API Contract Drift Report

> Compared sources: current runtime implementation vs `docs/module/health/api.md`, `nest_front/docs/health-api-integration.md`, and `nest_front/docs/health-frontend-implementation.md`.
> Review date: 2026-09-18. No source or business code was modified.

## Summary

The current backend exposes **15**, not 14, user-facing health endpoints. The old documents omit or under-specify response envelopes, strict input behavior, validation ranges, error behavior, date-time offsets, and several runtime response shapes. The table contains **18 actionable drift items**; repeated examples of the same underlying issue are grouped together.

| # | Area | Old document claim / omission | Runtime implementation | Risk | Recommendation |
|--:|---|---|---|---|---|
| 1 | Endpoint count | `api.md` says 14 | Controller has 15 routes | High | Correct the count when the design baseline is revised. |
| 2 | Envelope | Examples show bare payloads | Every health route returns `{code,message,data}` | High | Consumers must unwrap `data`; document global envelope. |
| 3 | Authentication | Knowledge reads presented as public-style browse/search | Class-level user guard protects knowledge too | High | Require user Bearer token for every listed route. |
| 4 | Profile field enums | Examples imply sex/lifestyle finite choices | All profile string fields accept arbitrary trimmed strings (length-limited) | Medium | Remove invented enums or add them only through a sanctioned design/code change. |
| 5 | Profile update | Says full current form is submitted / optionality deferred | Every field optional + nullable; `{}` valid; omit preserves and null clears | High | Publish exact optional/nullable semantics. |
| 6 | Profile empty result | Says implementation may decide null or standard empty result | Runtime returns envelope data `null` | Medium | Specify the concrete 200/null behavior. |
| 7 | Metric constraints | Describes union conceptually | Exact bounds are weight (0,1000], temperature [20,60], heart-rate (0,500], BP 400/300 with systolic >= diastolic; custom only finite | High | Include all per-branch rules. |
| 8 | Metric unknown fields | Does not establish handling | Every union branch is strict; `unit`, wrong-branch fields, and unknown fields are 400 | High | Document strict object behavior. |
| 9 | Metric list response | Examples leave template linkage expectation unclear | Custom record response omits `templateId` despite persistence | Medium | Do not consume a response `templateId` until backend mapper is intentionally changed. |
| 10 | Trend input | Date examples use date-only `from`/`to` | Runtime requires offset-bearing ISO date-times; date-only rejects | High | Correct all trend/query date examples. |
| 11 | Trend response | Assumes numeric unit/statistics | Empty single-value result has `unit: null` and numeric statistics null; trend is `stable` | High | Model nullable empty-result response. |
| 12 | Template active=false | Semantics not fixed | `active=true` filters open records; `active=false` returns all records | Medium | Either document actual behavior or approve a code/design correction. |
| 13 | Template patch | Shows only ending a template | `endedAt:null` clears/reopens; non-empty strict body required; no date-order rule | Medium | Document patch/null semantics. |
| 14 | Knowledge output | Detail example requires source URL; list source handling not precise | `source.url` and list/detail `summary` can be null; `source.name` is required | High | Correct nullable fields. |
| 15 | Analysis symptoms | Requirement/document imply preset symptoms | Backend accepts arbitrary 1..50-char strings; no enum and duplicates allowed | High | Do not treat UI presets as API enum. |
| 16 | Analysis duration | Old material uses/illustrates `over_week` | Runtime enum is `over_a_week` | High | Replace value everywhere. |
| 17 | Analysis details | Old document calls the detail DTO stable | Controller exposes snapshots as generic `object`; legacy-row schema is unknown | High | Do not publish a false stable deep schema; version/migrate snapshots first if one is needed. |
| 18 | Status/errors | No concrete runtime status/error envelope | Runtime has 400/401/403/404/500 and analysis 502/503/504, all envelope-wrapped | High | Include the error matrix and prohibit exact matching messages. |

## Additional implementation findings (not design drift)

- `GET /metrics/trend` accepts `page`/`pageSize` through its shared query schema but ignores both.
- `GET /metrics` permits `metricType` and `templateId` together and does not validate template ownership/existence; it simply applies both filters.
- `GET /analyses` casts persisted snapshots as strings at runtime. Current POST-created rows are valid, but historic/corrupt rows can violate the advertised enum shape.
- `POST /analyses` maps LLM errors to 502/503/504; source does not give a dedicated knowledge-retrieval exception class, so a database retrieval failure is an unhandled 500.

## Suggested disposition

Keep `api.md` frozen as the design baseline. Use `api-contract.md` as the strict current-code integration Contract, and route any desired behavior correction through the normal approved baseline-design or implementation-change process; this audit does not authorize changing either backend behavior or the frozen baseline.

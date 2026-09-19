# Frontend Contract Mismatch Report

> Compared source: `nest_front/users/src/views/health` against the current backend runtime implementation.  
> Review date: 2026-09-18. This report is static-only; no frontend code was changed.

## Summary

**11 mismatches** were found: **6 high-risk** (request rejection or deterministic response-parser failure), 3 medium-risk, and 2 low-risk/typing gaps. Existing health frontend files are user changes in the working tree and were read without modification.

| # | Severity | Frontend behavior | Actual backend contract | Consequence | Location |
|--:|---|---|---|---|---|
| 1 | High | Severity type/UI/parser permits `noticeable` | Only `mild`, `moderate`, `severe` | Selecting “明显” sends 400; reading a valid `severe` response throws client parse error | `types/health.ts`, `AnalysisForm.vue`, `api/health.ts` |
| 2 | High | Duration uses `over_week` | Only `over_a_week` | Selecting “一周以上” sends 400; valid response parsing fails | same files |
| 3 | High | Metric form initializes `datetime-local` and submits it through `new Date(...).toISOString()` correctly, but trend filters submit bare `YYYY-MM-DD` | `from`/`to` require explicit-offset ISO date-times | Any non-empty trend date filter receives 400 | `index.vue` |
| 4 | High | Trend parser requires `target.unit` string and every statistic number | Empty series returns `unit: null`, and latest/average/min/max/change are null | Empty trend response causes client parse error rather than empty chart state | `api/health.ts`, `types/health.ts` |
| 5 | High | Knowledge-detail parser requires `source.url` string | Backend emits `string | null` | Published knowledge without a source URL causes parse error | `api/health.ts`, `types/health.ts` |
| 6 | High | Analysis-detail parser requires `input.description` string | It is optional; a valid POST may omit it, and saved detail then omits it | Valid analysis detail fails to parse | `api/health.ts`, `types/health.ts` |
| 7 | Medium | `HealthProfileInput` is `Omit<HealthProfile,...>` so all nine fields are required, and sex only male/female | Backend permits a partial `{}` and arbitrary trimmed `sex` text | UI/type blocks valid partial use and rejects valid server values | `types/health.ts`, `api/health.ts` |
| 8 | Medium | Template patch type has `endedAt?: string` | Backend accepts `endedAt?: string | null` to clear/reopen | Client cannot express a supported operation | `types/health.ts` |
| 9 | Medium | Template list client asks `active=true`, matching only open templates | `active=false` is not “ended-only”; it means no active filter | Future use of false would display unexpected rows | `api/health.ts` |
| 10 | Low | Metric record client type/parser has optional `templateId` | Backend never returns `templateId` in metric mapper | The optional shape masks a server omission; client cannot associate custom records from list data | `types/health.ts`, `api/health.ts` |
| 11 | Low | `AnalysisDetail.context` is treated as arbitrary record but result parser assumes fully stable current shape | Backend controller declares historical snapshots only as `object` | Legacy/corrupt snapshot rows are not safely consumable | `types/health.ts`, `api/health.ts` |

## Confirmed compatible behaviors

- Requests are made to the correct 15 `/api/health/...` paths and unwrap the common envelope.
- Metric create union names and system units match the backend; client submits offset-bearing ISO timestamps for created metrics and templates.
- Template creation, metric list pagination defaults, knowledge list filters, and access-token-based request infrastructure are directionally compatible.
- The UI symptom choices are valid arbitrary backend strings. They are not, however, a backend enum.

## Required repair order (report-only)

1. Align analysis `severity` and `duration` literals in types, form options, request and response parsers.
2. Convert trend date-only controls into explicit-offset date-times before calling the backend, or omit them.
3. Make trend empty statistics/unit and optional analysis description nullable/optional in the parser and UI types.
4. Make knowledge `source.url` nullable; render an unavailable source link safely.
5. Align Profile and template-patch types with the backend's partial/null semantics.

These are recommendations only. Implementing them needs a separately authorized frontend change and validation run.

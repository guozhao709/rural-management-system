# M09 progress

Baseline before M09: `main` had a user-owned deletion of `.env.example` and newly added `CONTEXT.md` / `docs/M09`. These changes were preserved on `feature/health`. Baseline `pnpm typecheck` and `pnpm test` passed; E2E result is recorded with final quality evidence.

| ID | Task | Status | Evidence / next step |
| --- | --- | --- | --- |
| M09-001 | Health configuration | AUTOMATED_PASSED | Conditional validation/defaults in `src/config`; typecheck, build and lint pass. |
| M09-002 | Domain terminology/enums | AUTOMATED_PASSED | `resident-health.types.ts` exports scoped terminology and enums. |
| M09-003 | Consent entity/migration | AUTOMATED_PASSED | `health_consents` plus partial active-consent unique index in M09 Migration. |
| M09-004 | Consent API | AUTOMATED_PASSED | Owner-bound Controller/Service and E2E identity-forgery rejection. |
| M09-005 | Crypto port | AUTOMATED_PASSED | `HealthSensitiveDataCryptoPort` keeps business code away from environment keys. |
| M09-006 | Crypto adapters | AUTOMATED_PASSED | AES-GCM and explicit test-only adapter covered by tamper/wrong-key tests. |
| M09-007 | Profile entity/migration | AUTOMATED_PASSED | One-to-one encrypted-field schema in M09 Migration. |
| M09-008 | Profile API | AUTOMATED_PASSED | Owner-only partial update with explicit null clear and crypto-unavailable 503 test. |
| M09-009 | Measurement Zod union | AUTOMATED_PASSED | Five fixed-unit variants and future-time rejection are tested. |
| M09-010 | Measurement entity/migration | AUTOMATED_PASSED | Append-only table, index and soft-delete column in M09 Migration. |
| M09-011 | Measurement API/trends | AUTOMATED_PASSED | Owner-bound create/list/delete and fixed-range trend query are implemented and tested. |
| M09-012 | Triage port | AUTOMATED_PASSED | Versioned triage port and non-downgrade merge function are tested. |
| M09-013 | Unavailable triage adapter | AUTOMATED_PASSED | Missing approved rules returns 503; test proves fail-closed behavior. |
| M09-014 | Approved rules import | EXTERNAL_REVIEW_REQUIRED | Requires professional approval evidence. |
| M09-015 | Assessment DTO/result schema | AUTOMATED_PASSED | Structured symptoms and strict safe result schema; legacy identity/result fields are rejected by global validation. |
| M09-016 | Knowledge Article/Version entities | AUTOMATED_PASSED | Article/version tables and immutable-version constraints added to M09 Migration. |
| M09-017 | Knowledge draft/review API | AUTOMATED_PASSED | Admin/Super Admin Controller, state transition and immutable published-version revision test pass. |
| M09-018 | Knowledge publish/archive state | AUTOMATED_PASSED | Super Admin endpoint validates source/review/review-due fields and records publish/archive metadata audit; professional evidence remains a production acceptance item. |
| M09-019 | Public knowledge search | AUTOMATED_PASSED | User API only queries published versions whose review period is current; facade tests cover minimum outputs. |
| M09-020 | Official knowledge seed | EXTERNAL_REVIEW_REQUIRED | Source and reviewer verification required. |
| M09-021 | AI explanation port | AUTOMATED_PASSED | Provider-independent `HealthExplanationLlmPort` contract is registered. |
| M09-022 | LLM adapters | AUTOMATED_PASSED | Default unavailable adapter is tested; it keeps rule-first assessment available without fabricating AI output. |
| M09-023 | Prompt/post-validation | AUTOMATED_PASSED | Strict Zod schema and prohibited disease/probability/prescription/dose scan reject unsafe explanation output. |
| M09-024 | Assessment/ref entities | AUTOMATED_PASSED | Assessment table has encrypted input snapshots, rule/version fields, owner index and user-scoped idempotency constraint. |
| M09-025 | Create assessment | AUTOMATED_PASSED | Consent, selected-measurement ownership, encryption, daily limit, safe deterministic triage result and idempotency are covered by tests. |
| M09-026 | Assessment history/delete | AUTOMATED_PASSED | Owner-only list/detail/soft-delete API semantics and 404 isolation are implemented. |
| M09-027 | Health access audit | AUTOMATED_PASSED | Metadata-only audit table/service records health read/write/delete and knowledge governance events. |
| M09-028 | M07 public facade | AUTOMATED_PASSED | `ResidentHealthRetrievalFacade` exports only public metadata; unavailable content returns 404. |
| M09-029 | User frontend migration | IN_PROGRESS | Health page uses M09 consent/assessment endpoints and no client identity/disease/drug fields; local frontend toolchain approval is still required for build evidence. |
| M09-030 | Legacy dry-run importer | PENDING | Isolated/idempotent report. |
| M09-031 | Quality gate | IN_PROGRESS | 2026-08-25: backend typecheck/lint/build and 15 E2E tests pass; assessment/audit migrations applied. Frontend build is blocked locally by pnpm ignored-build policy; format/coverage target remains. |
| M09-032 | Professional safety acceptance | EXTERNAL_REVIEW_REQUIRED | Requires inspectable clinical/legal evidence. |

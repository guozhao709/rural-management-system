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
| M09-011 | Measurement API/trends | IN_PROGRESS | Owner-bound create/list/delete completed; trends remain. |
| M09-012 | Triage port | AUTOMATED_PASSED | Versioned triage port and non-downgrade merge function are tested. |
| M09-013 | Unavailable triage adapter | AUTOMATED_PASSED | Missing approved rules returns 503; test proves fail-closed behavior. |
| M09-014 | Approved rules import | EXTERNAL_REVIEW_REQUIRED | Requires professional approval evidence. |
| M09-015 | Assessment DTO/result schema | PENDING | Reject legacy danger fields. |
| M09-016 | Knowledge Article/Version entities | AUTOMATED_PASSED | Article/version tables and immutable-version constraints added to M09 Migration. |
| M09-017 | Knowledge draft/review API | IN_PROGRESS | Admin/Super Admin Controller and Service implemented; dedicated service/E2E state tests remain. |
| M09-018 | Knowledge publish/archive state | IN_PROGRESS | Super Admin endpoint validates source/review/review-due fields; requires professional evidence before production use. |
| M09-019 | Public knowledge search | PENDING | Published, in-date only. |
| M09-020 | Official knowledge seed | EXTERNAL_REVIEW_REQUIRED | Source and reviewer verification required. |
| M09-021 | AI explanation port | PENDING | Provider-independent contract. |
| M09-022 | LLM adapters | PENDING | Unavailable by default. |
| M09-023 | Prompt/post-validation | PENDING | Fail-safe schema validation. |
| M09-024 | Assessment/ref entities | PENDING | Add idempotency/version storage. |
| M09-025 | Create assessment | PENDING | Disabled absent approved rules. |
| M09-026 | Assessment history/delete | PENDING | Owner-only semantics. |
| M09-027 | Health access audit | PENDING | No sensitive plaintext. |
| M09-028 | M07 public facade | PENDING | Public-only contract. |
| M09-029 | User frontend migration | PENDING | Remove client identity/disease/drug fields. |
| M09-030 | Legacy dry-run importer | PENDING | Isolated/idempotent report. |
| M09-031 | Quality gate | PENDING | Run after implementation. |
| M09-032 | Professional safety acceptance | EXTERNAL_REVIEW_REQUIRED | Requires inspectable clinical/legal evidence. |

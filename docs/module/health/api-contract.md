# Health API Contract — Verified Runtime

> Status: **VERIFIED (static implementation audit)**  
> Evidence scope: `nest_server/src/modules/health`, application setup, global response/exception handling, and user authentication guard, reviewed on 2026-09-18.  
> Document role: strict API Contract generated from the current verified backend behavior. Its design baseline remains the frozen `api.md`; this document does not silently change that baseline.

## 1. Contract metadata and evidence labels

- **VERIFIED** means directly established by the inspected route, schema, service, mapper, guard, interceptor, or exception filter.
- **INFERRED** means the result follows framework behavior from the installed NestJS 11.2.1 runtime (for example, an undecorated `POST` uses 201).
- **UNKNOWN** means source does not establish the value. Consumers must not invent it.
- Actual user-facing endpoints: **15**. All are under `/api/health` and all require a user Bearer access token, including knowledge endpoints.

## 2. Global rules

### Authentication

Every endpoint uses `UserAuthGuard`.

```http
Authorization: Bearer <user access token>
```

The scheme must be exactly `Bearer` with one non-empty token and no third token segment. A missing/malformed/invalid token, missing user, or deleted user produces `401`; a disabled user produces `403`. Private resources are always scoped to the authenticated `user.id`; no endpoint accepts `userId`.

### Success and error envelopes

All health handlers pass through the global envelope interceptor. No health route opts out.

```ts
export interface ApiEnvelope<T> {
  code: number;       // the actual HTTP response status
  message: '操作成功';
  data: T | null;
}

export interface ApiErrorEnvelope {
  code: number;       // the actual HTTP response status
  message: string;    // display text; do not exact-match it
  data: null;
}
```

`DELETE /metrics/:id` returns `{ code: 200, message: '操作成功', data: null }` (INFERRED from the undecorated Nest DELETE response and the interceptor). `POST` successes are `201`; all other success routes are `200` (INFERRED from installed NestJS default status behavior).

All `Date` objects emitted by the mapper serialize through Express JSON as ISO-8601 UTC strings (normally ending in `Z`; milliseconds are implementation data). `birthDate` is stored and returned as `YYYY-MM-DD`.

### Input parsing

Request bodies and queries are parsed by explicit Zod schemas, not DTO decorators. Every listed object schema is `.strict()`: unknown object keys cause `400`. Trimmed string fields are returned/persisted after trimming. Zod `z.coerce.number()` accepts numeric JSON values and strings coercible by JavaScript `Number`; consumers should send JSON numbers / decimal query strings, not depend on coercion edge cases.

All invalid Zod input produces `400`, `data: null`; the message is a semicolon-joined Zod issue message and is not stable. A route `:id` uses Nest `ParseIntPipe`: it accepts only a signed integer-character string (`^-?\\d+$`), returns a number, and otherwise produces `400` with a non-stable message. It has **no positive-value constraint**; `0` and negative integer IDs reach the service and normally resolve to `404`.

### Shared types

```ts
export type SystemMetricType =
  | 'weight' | 'blood_pressure' | 'heart_rate' | 'temperature';
export type MetricType = SystemMetricType | 'custom';
export type Trend = 'up' | 'down' | 'stable';
export type AnalysisSeverity = 'mild' | 'moderate' | 'severe';
export type AnalysisDuration =
  | 'today' | '1_3_days' | '4_7_days' | 'over_a_week' | 'recurring';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface SeriesStatistics {
  latest: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  change: number | null;
  trend: Trend;
}
```

All page queries default to `page=1`, `pageSize=20`; each is an integer, minimum 1, and `pageSize` maximum 100. There is no maximum page number. `from` and `to` are independently applied inclusive bounds; no source validation rejects `from > to`, so it returns an empty data set when no record can match both.

Date input rules: `birthDate` must be exactly a calendar `YYYY-MM-DD`. Every `measuredAt`, `startedAt`, `endedAt`, `from`, and `to` must be an ISO-8601 date-time with an explicit offset; `Z` is accepted, a numeric offset is accepted, and a timezone-less `datetime-local` string is rejected. There is no separate business rule constraining future dates or ordering between template start/end dates.

## 3. Endpoint index

| # | Method | Path | Success |
|--:|---|---|---|
| 1 | GET | `/api/health/profile` | 200 |
| 2 | PUT | `/api/health/profile` | 200 |
| 3 | GET | `/api/health/metrics` | 200 |
| 4 | POST | `/api/health/metrics` | 201 |
| 5 | DELETE | `/api/health/metrics/:id` | 200 |
| 6 | GET | `/api/health/metrics/trend` | 200 |
| 7 | GET | `/api/health/metric-templates` | 200 |
| 8 | POST | `/api/health/metric-templates` | 201 |
| 9 | GET | `/api/health/metric-templates/:id` | 200 |
| 10 | PATCH | `/api/health/metric-templates/:id` | 200 |
| 11 | GET | `/api/health/knowledge` | 200 |
| 12 | GET | `/api/health/knowledge/:id` | 200 |
| 13 | POST | `/api/health/analyses` | 201 |
| 14 | GET | `/api/health/analyses` | 200 |
| 15 | GET | `/api/health/analyses/:id` | 200 |

## 4. Profile

### GET `/profile`

**Purpose:** fetch the current user's profile. **Path/query/body:** None. **Success data:** `Profile | null`; `null` means no profile exists.

```ts
export interface Profile {
  id: number;
  sex: string | null;
  birthDate: string | null;       // YYYY-MM-DD
  heightCm: number | null;
  smokingStatus: string | null;
  drinkingStatus: string | null;
  exerciseStatus: string | null;
  sleepStatus: string | null;
  healthHistory: string | null;
  allergies: string | null;
  createdAt: string; updatedAt: string; // emitted ISO date-times
}
```

**Errors:** 401/403 authentication only. No profile is not a 404.

### PUT `/profile`

**Purpose:** create or partially update the current user's singleton profile. **Path/query:** None.

```ts
export interface PutProfileBody {
  sex?: string | null;                 // trim, max 20; not an enum
  birthDate?: string | null;            // YYYY-MM-DD
  heightCm?: number | null;             // coerced, > 0, <= 300
  smokingStatus?: string | null;        // trim, max 20; not an enum
  drinkingStatus?: string | null;       // trim, max 20; not an enum
  exerciseStatus?: string | null;       // trim, max 20; not an enum
  sleepStatus?: string | null;          // trim, max 20; not an enum
  healthHistory?: string | null;        // trim, max 5000
  allergies?: string | null;            // trim, max 5000
}
```

Every field is optional and nullable. Omission preserves an existing value; explicit `null` clears it. Empty strings are allowed (after trim) for all nullable string fields, including `sex` and history fields. An empty `{}` is valid and creates a profile if absent. Success data is `Profile`. **Errors:** 400 validation/unknown key; 401/403.

## 5. Metrics

### GET `/metrics`

**Purpose:** list authenticated user's metric records, descending by `measuredAt`. **Path/body:** None.

```ts
export interface MetricsQuery {
  metricType?: MetricType;
  templateId?: number;  // coerced positive integer
  from?: string; to?: string; // explicit-offset ISO date-times
  page?: number; pageSize?: number;
}
export type MetricRecord =
  | { id: number; metricType: 'blood_pressure'; unit: 'mmHg'; measuredAt: string; createdAt: string; systolic: number; diastolic: number }
  | { id: number; metricType: 'weight' | 'temperature' | 'heart_rate' | 'custom'; unit: string; measuredAt: string; createdAt: string; value: number };
```

`metricType` and `templateId` may both be supplied; they are combined with AND. `templateId` is not checked for ownership or existence on this list route. The response is `Page<MetricRecord>`. Critically, the mapper does **not** emit `templateId`, even for custom records. **Errors:** 400 invalid query/unknown query key; 401/403.

### POST `/metrics`

**Purpose:** create one record. **Path/query:** None. The object is strict: fields belonging to another branch, `unit`, and any unknown key are rejected.

```ts
export type CreateMetricBody =
  | { metricType: 'weight'; value: number; measuredAt: string } // value > 0, <= 1000; unit response is kg
  | { metricType: 'temperature'; value: number; measuredAt: string } // 20 <= value <= 60; unit ℃
  | { metricType: 'heart_rate'; value: number; measuredAt: string } // value > 0, <= 500; unit bpm
  | { metricType: 'blood_pressure'; systolic: number; diastolic: number; measuredAt: string } // systolic > 0, <= 400; diastolic > 0, <= 300; systolic >= diastolic; unit mmHg
  | { metricType: 'custom'; templateId: number; value: number; measuredAt: string }; // templateId positive integer; value finite, no min/max
```

`measuredAt` follows the global explicit-offset date-time rule. Success data is `MetricRecord`; custom records still omit `templateId`. **Errors:** 400 schema/refinement; 401/403; 404 when the custom template does not exist for the current user.

### DELETE `/metrics/:id`

**Purpose:** delete an owned record. **Path:** `id` as described in global rules. **Query/body:** None. **Success data:** `null`. **Errors:** 400 invalid id; 401/403; 404 `健康指标记录不存在` for missing or another user's record.

### GET `/metrics/trend`

**Purpose:** obtain all matching points ascending by `measuredAt` and deterministic statistics. **Body:** None. It accepts the `MetricsQuery` fields above, so `page` and `pageSize` are syntactically accepted/defaulted but ignored by trend calculation.

Exactly one target mode is required:

- `metricType` must be one of `weight`, `blood_pressure`, `heart_rate`, `temperature` and `templateId` must be absent; or
- `templateId` must be a positive integer and `metricType` must be absent.

`metricType=custom` alone is rejected; both `metricType` and `templateId` are rejected. `from`/`to` are inclusive and need explicit offsets.

```ts
export type MetricTrend =
  | { target: { type: 'blood_pressure'; unit: 'mmHg' }; points: Array<{ measuredAt: string; systolic: number; diastolic: number }>; statistics: { systolic: SeriesStatistics; diastolic: SeriesStatistics } }
  | { target: { type: 'weight' | 'temperature' | 'heart_rate' | 'custom'; unit: string | null }; points: Array<{ measuredAt: string; value: number }>; statistics: SeriesStatistics };
```

For an empty result, single-value `target.unit` is `null` and every numeric statistic is `null`, while `trend` is `'stable'`; the same empty statistics apply independently to blood-pressure series. `change` is latest minus first chronological value and statistics are rounded to two decimals except original latest/min/max values. **Errors:** 400 invalid target/schema; 401/403; 404 if a requested template is not owned/existent.

## 6. Metric templates

### GET `/metric-templates`

**Purpose:** list current user's templates, descending by `createdAt`. **Path/body:** None.

```ts
export interface TemplatesQuery { active?: 'true' | 'false'; page?: number; pageSize?: number }
export interface MetricTemplate {
  id: number; name: string; metricName: string; unit: string;
  relatedSystemMetricType: SystemMetricType | null;
  startedAt: string; endedAt: string | null; createdAt: string; updatedAt: string;
}
```

`active='true'` is transformed to boolean true and filters to `endedAt IS NULL`. `active='false'` is accepted but applies **no** filter, so it returns both active and ended templates. Success data is `Page<MetricTemplate>`. **Errors:** 400 invalid query/unknown key; 401/403.

### POST `/metric-templates`

**Purpose:** create a template. **Path/query:** None.

```ts
export interface CreateMetricTemplateBody {
  name: string;       // trim, 1..100
  metricName: string; // trim, 1..100
  unit: string;       // trim, 1..30
  relatedSystemMetricType?: SystemMetricType | null;
  startedAt: string;  // explicit-offset ISO date-time
}
```

`relatedSystemMetricType` omission and `null` both persist as null. Success data is `MetricTemplate`. **Errors:** 400 schema/unknown key; 401/403.

### GET `/metric-templates/:id`

**Purpose:** fetch an owned template. **Query/body:** None. **Success data:** `MetricTemplate`. **Errors:** 400 invalid id; 401/403; 404 `健康指标模板不存在` for missing/not-owned.

### PATCH `/metric-templates/:id`

**Purpose:** update template name and/or tracking end. **Query:** None.

```ts
export interface PatchMetricTemplateBody {
  name?: string;                // trim, 1..100
  endedAt?: string | null;      // explicit-offset ISO datetime or null
}
```

At least one key is required; unknown keys fail. Omitting a field leaves it unchanged; `endedAt: null` reopens/clears the end date. No ordering rule compares `endedAt` with `startedAt`. **Success data:** `MetricTemplate`. **Errors:** 400 invalid id/body; 401/403; 404 not found/not-owned.

## 7. Knowledge

### GET `/knowledge`

**Purpose:** list only published knowledge, descending by `updatedAt`. **Path/body:** None.

```ts
export interface KnowledgeQuery { q?: string; category?: string; page?: number; pageSize?: number }
export interface KnowledgeSummary {
  id: number; title: string; summary: string | null; category: string;
  tags: string[]; sourceName: string;
}
```

`q` is trimmed/max 100 and, when non-empty, case-insensitively searches title, summary, or content. `category` is trimmed/max 50 and exact-matches. Empty strings are valid and do not add a filter. Success data is `Page<KnowledgeSummary>`. `sourceName` is always a string in actual response (not nullable). **Errors:** 400 schema/unknown key; 401/403.

### GET `/knowledge/:id`

**Purpose:** fetch a published item. **Query/body:** None.

```ts
export interface KnowledgeDetail extends KnowledgeSummary {
  content: string;
  source: { name: string; url: string | null };
  createdAt: string; updatedAt: string;
}
```

**Errors:** 400 invalid id; 401/403; 404 `健康知识不存在` for missing or unpublished content.

## 8. Analyses

### POST `/analyses`

**Purpose:** create a saved AI health analysis. **Path/query:** None.

```ts
export interface CreateHealthAnalysisBody {
  symptoms: string[]; // required: 1..20 entries; each trim, 1..50; arbitrary strings, not enum; duplicates allowed
  severity: AnalysisSeverity;
  duration: AnalysisDuration;
  description?: string; // trim, maximum 2000; omitted allowed; empty string allowed
}
export interface AnalysisReference { knowledgeId: number; title: string; source: string }
export interface AnalysisResult {
  summary: string; concerns: string[]; factors: string[]; suggestions: string[];
  medicalAdvice: string; references: AnalysisReference[];
}
```

The body is strict. There is no requirement that a symptom belong to the UI's preset list and no de-duplication. The service reads up to 20 latest user metric records and up to 8 latest published knowledge records, invokes the configured LLM, validates its result, removes references not in that retrieved knowledge set, then persists snapshots.

Success data is **not** an analysis detail. It is `{ id: number, ...AnalysisResult, createdAt: string }`. The validated LLM result has these further limits: `summary` 1..2000; `medicalAdvice` 1..1000; each `concerns`, `factors`, and `suggestions` item 1..500 with max 10; and at most 10 references whose ids are positive integers and title/source max 200. Arrays may be empty.

**Errors:** 400 request schema; 401/403; 502 for upstream non-OK/network/empty/invalid JSON/invalid structured output; 503 if model configuration is absent; 504 on configured LLM timeout; 500 for unhandled failures (including persistence/retrieval failures). Error text is not stable.

### GET `/analyses`

**Purpose:** list current user's analysis summaries, newest first. **Path/body:** None. Query uses only `page` and `pageSize` (global pagination rules).

```ts
export interface AnalysisSummary {
  id: number; symptoms: string[]; severity: string; summary: string; createdAt: string;
}
```

`severity` is emitted from a persisted unvalidated `object` snapshot cast, so its runtime value is **UNKNOWN for legacy/corrupt rows**; records created by the current POST path use `AnalysisSeverity`. Success data is `Page<AnalysisSummary>`. **Errors:** 400 query; 401/403.

### GET `/analyses/:id`

**Purpose:** return the saved snapshots. **Query/body:** None.

```ts
export interface AnalysisDetail {
  id: number;
  input: object; context: object; result: object;
  createdAt: string;
}
```

For rows created by the current `POST`, `input` matches `CreateHealthAnalysisBody` after Zod transforms; `context` has `{ profile, recentMetrics, statistics, knowledge }`; `result` matches `AnalysisResult`. Because controller mapper declares each snapshot only as `object`, their full public type is **UNKNOWN** for historical rows and must not be relied on beyond that. **Errors:** 400 invalid id; 401/403; 404 `健康分析不存在` for missing/not-owned.

## 9. Error matrix

| Status | Verified source behavior |
|---:|---|
| 400 | Zod validation, strict unknown keys, trend target rule, or invalid `ParseIntPipe` id |
| 401 | malformed/missing/invalid access token, missing/deleted user |
| 403 | authenticated user is disabled |
| 404 | owned metric/template/analysis absent; template unavailable for custom metric/trend; published knowledge absent |
| 500 | uncaught application/persistence failures; message is `服务端异常` |
| 502 | configured LLM upstream fails, returns bad/empty content, or fails result schema |
| 503 | health analysis model settings missing |
| 504 | configured LLM request aborts on timeout |

No health code actively throws 409. No endpoint establishes a 204 response.

## 10. Consumer self-check

**YES, with the explicit UNKNOWN boundary for historical analysis snapshot objects.** A new consumer can call every current endpoint without guessing enums, nullability, response envelope, pagination, date input format, or status behavior. It must treat error messages and historical snapshot internals as non-stable.

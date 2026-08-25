# M09 assumptions

| Assumption | Conservative default | Basis | Status | Configuration / replacement |
| --- | --- | --- | --- | --- |
| Personalised assessment | Disabled | No approved, inspectable safety rules | External review required | `HEALTH_ASSESSMENT_ENABLED`, approved rules adapter |
| AI explanation | Disabled | No provider/data-processing approval | External review required | `HEALTH_AI_EXPLANATION_ENABLED` |
| Health-data retention | 365 days | Design section 21 | Needs legal/product confirmation | `HEALTH_DATA_RETENTION_DAYS` |
| Minors | Public knowledge only | Design section 21 | Implemented default | Service checks birthday; guardian flow is future work |
| Knowledge publication | Seed/import content remains draft | No professional reviewer evidence | External review required | Admin review metadata and super-admin publish action |
| Legacy routes | Disabled | V2 migration avoids client identity fields | Implemented default | `HEALTH_LEGACY_ROUTES_ENABLED` |

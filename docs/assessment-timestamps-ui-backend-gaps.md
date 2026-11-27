# Assessment & discovery timestamp columns — UI ↔ API gaps

This document is for the **migration-planner backend** team. It describes how the SaaS UI maps **Data collected on** and **Imported to console**, what renders as **"—"** today, and what API changes would remove UI workarounds (especially for assessments list).

## UI field mapping (current)

| UI label                | Assessments (report + table)                                                                               | Discovery appliances (table)       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Data collected on**   | `snapshots[].inventory.collection_time`, or newest RVTools `subsetInventories[].inventory.collection_time` | `source.inventory.collection_time` |
| **Imported to console** | `assessment.createdAt`                                                                                     | `source.createdAt`                 |

**Note:** The product definition of **Last updated** (inventory edited in SaaS, e.g. VM excluded) is **not** shown on these views in the current design. If we add it later, we need an explicit API timestamp (see gaps below).

---

## What the UI cannot show (or shows as "—")

| UI label                                | Surface                                       | When UI shows **"—"**                                    | Root cause                                                                                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data collected on**                   | Assessments **table**                         | List response has no `collection_time` on stub inventory | `GET /api/v1/assessments` (`listAssessments`) returns **stub** snapshots: counts only, **no** `collection_time`, often **no** `subsetInventories`. UI shows **"—"** until the list payload includes metadata (P0) or the user opens a view that loads `getAssessment`. |
| **Data collected on**                   | Assessments **report**                        | No `collection_time` on main or subset inventory         | Backend never set/stored `collection_time` (legacy manual JSON, missing RVTools export metadata, unknown agent collection).                                                                                                                                            |
| **Data collected on**                   | Discovery appliances **table**                | No inventory or `collection_time` is null                | List returns full `Source` + `inventory` JSON; **"—"** means stored data has no `collection_time` (no inventory yet, manual upload without field, old payloads). **Not** a list-vs-detail stub issue.                                                                  |
| **Imported to console**                 | Assessments & appliances                      | Rare                                                     | `createdAt` is required on API models; should almost always render.                                                                                                                                                                                                    |
| **Last updated** (inventory edits)      | Not in current design                         | N/A — not displayed                                      | SaaS “inventory changed” time exists in DB as `Assessment.updatedAt` but is **not** on public OpenAPI `Assessment`. Latest snapshot `createdAt` ≈ latest stored inventory row, not “first import”.                                                                     |
| **Imported** = first inventory received | Discovery appliances                          | N/A — UI uses `source.createdAt`                         | No API field for “first time inventory landed on this source” if that differs from environment `createdAt` (e.g. manual upload days later).                                                                                                                            |
| **Per–vCenter collection time**         | Assessments **table** (multi–vCenter RVTools) | N/A — single cell                                        | UI shows one value: main `collection_time` or **newest** subset `collection_time`, not per vCenter unless API/product adds it.                                                                                                                                         |

---

## Assessments list vs GET (main gap)

| Endpoint                       | `collection_time`       | `subsetInventories` | Snapshot `createdAt` semantics      |
| ------------------------------ | ----------------------- | ------------------- | ----------------------------------- |
| `GET /api/v1/assessments`      | **No** (stub inventory) | **No**              | Uses `assessment.createdAt`         |
| `GET /api/v1/assessments/{id}` | **Yes** (when stored)   | **Yes** (RVTools)   | Uses main inventory row `createdAt` |

List mapper reference: `AssessmentListToApi` in migration-planner (`internal/handlers/v1alpha1/mappers/outbound.go`).

---

## Recommended backend changes

| Priority | Change                                                                                                                                                                                 | Benefit                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **P0**   | Add `collectionTime` (nullable) to assessment **list/summary** payload (`AssessmentV2Summary` and/or v1 list items), sourced from latest main inventory or aggregated RVTools metadata | Removes N+1 `getAssessment` calls from UI; table matches report without workarounds. |
| **P1**   | Ensure `collection_time` is always populated on ingest (agent, RVTools, manual upload paths)                                                                                           | Fewer **"—"** cells on discovery appliances and assessments.                         |
| **P2**   | Expose `updatedAt` or `lastInventoryUpdatedAt` on `Assessment` if product needs **Last updated** separate from **Imported**                                                            | Clear SaaS edit/regenerate timestamp without overloading snapshot `createdAt`.       |
| **P2**   | Optional `importedAt` if “imported to console” must differ from `createdAt` (re-upload flows)                                                                                          | Aligns with product copy without UI heuristics.                                      |
| **P3**   | Optional per–vCenter `collection_time` on list summary for multi–vCenter RVTools                                                                                                       | Richer table without opening report.                                                 |

---

## OpenAPI / schema references

- `Inventory.collection_time` — oldest known source collection time (nullable).
- `Assessment.createdAt` — assessment row creation (UI: **Imported to console**).
- `Source.createdAt` — discovery appliance creation (UI: **Imported to console**).
- `Snapshot.createdAt` — latest stored inventory row time (**not** used for **Imported** in UI).

Full schema: `migration-planner/api/v1alpha1/openapi.yaml`.

---

## UI workarounds in place (until P0)

1. **`mergeListedAssessmentPreservingSubsetInventories`** — When an assessment was already loaded via `getAssessment` (e.g. report), preserves `subsetInventories` and `collectionTime` on list polling refreshes (including when list vs GET `snapshot.createdAt` differ).

Removable once list responses include `collectionTime` (P0); no per-row list enrichment is performed.

# Disconnected appliance update & agent image download — UI ↔ backend readiness

This document is for the **migration-planner** backend and release teams. It describes how the SaaS UI implements disconnected **agent image download** and the **Agent version** column (HPUX-2273/2274, prototype HPUX-2438), which API surface the UI calls, what the backend already provides, and what must ship in **API + SDK + ops** for end-to-end behavior.

## UI behavior (summary)

| Surface                                                 | When shown                                                                                  | UI action                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Discovery environments table — **Agent version** column | Per source: up to date, N/A, outdated, update available, download pending, image downloaded | Status label opens a popover with `agentVersionWarning` and actions (e.g. download agent image, generate new OVA). |
| Table row kebab — **Download agent image**              | Disconnected source with **update available** and in-place update supported                 | Fetches presigned URL, then browser download of appliance `.tar`.                                                  |
| Popover — **Download image**                            | Same conditions inside the version popover                                                  | Same download flow as kebab.                                                                                       |

Connectivity and in-place rules live in the UI (`versionStatusLogic.ts`, `useAgentImageDownload.ts`) but depend on API fields **`agentVersion`**, **`agentVersionWarning`**, and **`applianceUpdateSupported`** (with a temporary fallback that parses warning text when the boolean is missing).

---

## API the UI uses (not a separate agent URL)

The UI does **not** call a dedicated `/agent-image-url` route. It uses the unified source download endpoint:

| Operation                     | Endpoint                                             | Notes                                                       |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Presigned appliance image URL | `GET /api/v1/sources/{id}/image-url?image=appliance` | Same handler as OVA; `image` query is `ova` or `appliance`. |
| Source list / get             | `GET /api/v1/sources`, `GET /api/v1/sources/{id}`    | Needs version fields on each `Source` in the response.      |

**Store call (UI):** `ImagesStore.getAgentImageDownloadUrl()` → planner-sdk `getSourceDownloadURL` with `GetSourceDownloadURLImageEnum.Appliance`.

**Token download (backend):** Presigned URL hits image-by-token with `{name}=appliance` (constant `image.AppliancePathName`), which streams the appliance tar — see `GetImageByToken` in `internal/handlers/v1alpha1/image.go`.

OpenAPI reference: `migration-planner/api/v1alpha1/openapi.yaml`.

---

## Already implemented in migration-planner (code)

| Capability                       | Implementation                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Mint presigned appliance URL     | `GetSourceDownloadURL` / source service with `image=appliance`                                                                                  |
| Serve appliance `.tar`           | `serveAgentImage` → `image.ServeAgentImageTar` (404 if tar not staged)                                                                          |
| Stamp `agentVersion` on download | `stampAgentVersion` after **both** appliance tar and OVA token download (disconnected “image downloaded” UX)                                    |
| List/get source fields           | Outbound mapper: `agentVersion`, `agentVersionWarning`, `applianceUpdateSupported` (`internal/handlers/v1alpha1/mappers/outbound.go`)           |
| Version / warning logic          | `KnownApplianceVersion`, `CheckAgentVersionWarning` (`internal/service/source.go`); `IsUpdateSupported` / `MinApplianceVersion` (`pkg/version`) |
| Connected agent upgrade path     | Agent handler can return appliance presigned URL when image is staged (`GetImageUpgradeStatus`, `agentImageStaged`)                             |
| Handler tests                    | Coverage for `image=appliance` on source download URL (see `source_test.go`)                                                                    |

**Do not add** a separate `GET .../agent-image-url` unless product explicitly changes the API contract; the UI is aligned on `image-url?image=appliance`.

---

## Gaps: what backend / release still needs

### P0 — Contract and deployment

| Item                                                         | Why it matters                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Publish planner-sdk** from current OpenAPI                 | UI targets `@openshift-migration-advisor/planner-sdk` (e.g. 0.33+). Generated clients must include `getSourceDownloadURL` with `image: 'appliance'` and `Source.applianceUpdateSupported`. If the field is missing from TypeScript types, UI still reads it at runtime but typings and stubs drift. |
| **Deploy migration-planner** build that matches that OpenAPI | SaaS must run the handler/mapper behavior above in the target environment.                                                                                                                                                                                                                          |

### P0 — Appliance image artifacts (ops)

| Item                                                                                                                         | Why it matters                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Staged appliance image tar** with the running ISO/planner (`IsoPath`, `MIGRATION_PLANNER_IMAGE_URL`, image build pipeline) | Without staging, `agentImageStaged()` is false: users get 404 / “not available yet”; agents may see `Supported: true` but no `ImageUrl` until the tar exists. |

### P1 — Version policy per release

| Item                                                                                                                     | Why it matters                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Correct **`AgentVersionName`** (served appliance version) and **`MinApplianceVersion`** (in-place floor) in each release | Drives `UpdateAvailable`, `applianceUpdateSupported`, and warning text. Wrong flags hide kebab/download or show wrong column state. |
| Document policy for product/QA                                                                                           | Same rules as `CheckAgentVersionWarning` and `version.IsUpdateSupported`.                                                           |

### P1 — API data quality

| Item                                                       | Why it matters                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Always populate **`applianceUpdateSupported`** on list/get | UI should not rely long-term on inferring in-place support from warning strings (“does not support in-place”, “Deploy a new OVA”).                |
| Reliable **`agentVersion`**                                | Agent-reported version with OVA/appliance-download stamp fallback (`KnownApplianceVersion`). Needed for “Image downloaded” vs “Update available”. |

### P2 — Product copy (optional)

| Item                                                           | Why it matters                                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Connected vs disconnected** wording in `agentVersionWarning` | UI renders API warning text in popovers as-is. Design may want different copy by connectivity; that is a backend message change (and possibly branching on stored source connectivity). |

### P2 — QA (recommended)

| Item                                                                                                                         | Why it matters                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| E2E or integration: disconnected source → `image-url?image=appliance` → download → list/get shows stamped **`agentVersion`** | Validates stamp path for disconnected flows.    |
| Exercise presigned URL expiry and 401/404/500                                                                                | Matches UI error handling for failed downloads. |

---

## Warning messages (backend-owned today)

`CheckAgentVersionWarning` (`internal/service/source.go`) returns:

- No version / unknown format: prompt to download a new OVA for compatibility.
- Update available, **in-place not supported**: version does not support in-place updates; deploy new OVA.
- Update available, **in-place supported**: generic mismatch message (currently similar wording to “consider downloading a new OVA”; connected in-place UX may differ in a future copy pass).

`applianceUpdateSupported` is set from `version.IsUpdateSupported(current, version.MinApplianceVersion())` in the outbound mapper.

---

## OpenAPI / schema fields used by UI

| Field                                       | Role in UI                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Source.agentVersion`                       | Column state; “Image downloaded” when stamped version matches served version (disconnected heuristics). |
| `Source.agentVersionWarning`                | Popover body text when update/outdated paths apply.                                                     |
| `Source.applianceUpdateSupported`           | Enables **Download agent image** / in-place popover actions; `false` → generate new OVA path.           |
| `Source` connectivity / manual upload flags | UI uses existing source model flags to treat environment as disconnected and to gate download actions.  |

---

## UI implementation references (this repo)

- `src/data/stores/ImagesStore.ts` — `getAgentImageDownloadUrl` via `image=appliance`.
- `src/ui/environment/helpers/versionStatusLogic.ts` — column state machine.
- `src/ui/environment/views/VersionStatus.tsx` — popover, download, generate OVA.
- `src/ui/environment/hooks/useAgentImageDownload.ts` — download orchestration.
- `src/models/SourceModel.ts` — `applianceUpdateSupported` on domain model.

When P0 items ship, UI can drop warning-string inference for `applianceUpdateSupported` once all environments return the boolean.

# RAC Designer TETO — Multi-house Persistence Evolution Plan

The application can be transformed into a **complete persisted project editor** without discarding the current drawing engine. The right move is not to “persist the canvas as the source of truth”, but to **promote the domain model** so that a construction project contains multiple houses, each house is linked to one family, and the drawing becomes a projection of that persisted model rather than the only place where state lives.[1] [2] [3] [4]

At the moment, the application is structurally constrained to a **single active house**. The current state contract is `HouseState<TGroup>`, which models only one house and has no `familyId`, no project root, and no multi-house container.[2] The central manager instantiates exactly one aggregate, uses an **in-memory adapter**, and keeps `familyName` plus selected piloti heights outside the persisted `HouseState`, which is why that information is not durable today.[1] The current import/export flow also serializes only `canvas.toJSON()` and rebuilds house state from Fabric objects afterwards, which means persistence is still **canvas-centric**, not domain-centric.[4]

| Current limitation | Why it matters |
|---|---|
| One `HouseState` only | You cannot manage multiple houses inside one construction project. |
| In-memory persistence | Data disappears between sessions unless exported manually. |
| Family metadata outside persisted state | A house cannot be durably associated with a family. |
| Raw Fabric JSON export | The file stores drawing structure, not a normalized project document. |

## What the spreadsheet is really modeling

The reference sheet is not just “one house form”. It already contains several latent entities. The visible `RACS` sheet has 50 columns and 12 records, with fields that naturally cluster into family identity, project grouping, terrain/obstacle conditions, piloti configuration, derived piloti totals, observations, and assigned monitors.[5]

The strongest signal in the spreadsheet is that the row is really a **house assignment record** inside a broader execution context. The values show repeated `cc` and community values, repeated monitor teams, and repeated leader groups, while family names vary row by row.[5] In other words, the row is not a pure “family” entity and not a pure “house template” entity either; it is a **house-in-project record**.

| Spreadsheet group | Representative columns | Recommended entity meaning |
|---|---|---|
| Family identity | `familia` | `Family` |
| Project/construction grouping | `cc`, `comunidade`, `lideres` | `ConstructionProject`, `Community`, `Person`, `ProjectLeaderAssignment` |
| House classification | `casa`, `tipo` | `House`, `HouseTemplate` or `HouseType` |
| Site conditions | `desnivel`, `concreto-grosso`, `concreto-fino`, `pedra`, `água`, `raízes`, `solo-outro`, `cano`, `galhos`, `fios`, `obstaculos-outro` | `SiteAssessment` + optional `SiteObstacle` / `SoilCondition` |
| Piloti layout | `piloti-mestre`, `piloti-a1 ... piloti-c4`, `altura-mestre` | `HousePilotiLayout` + `PilotiPoint` |
| Derived counts | `total-piloti-1`, `15`, `2`, `25`, `3`, `35` | computed fields, not primary entities |
| Notes | `observações` | `HouseNotes` or `ProjectNote` |
| Monitor assignments | `monitor-1 ... monitor-6`, phone columns | `Person` + `HouseMonitorAssignment` or `ProjectMonitorAssignment` |

## Entity decomposition I would adopt

I would introduce a **project root** and then normalize the row into entities with clear ownership. The cleanest hierarchy is:

```text
ConstructionProject
  ├── Community
  ├── Families
  ├── Houses
  │     ├── SiteAssessment
  │     ├── PilotiLayout
  │     ├── HouseViews / DrawingDocument
  │     └── Notes
  ├── ProjectLeaders
  └── MonitorAssignments
```

This matters because some information belongs to the **project**, some belongs to the **family**, and some belongs to the **house instance**. If you store everything inside one flattened record, editing becomes fragile very quickly.

### 1. `ConstructionProject`

This becomes the top-level saved document. In your case, a project corresponds to the construction batch or mission, and `cc` is a strong candidate for the external project code. A project should contain many houses.[5]

Suggested fields:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Internal primary key |
| `externalCode` | string | From `cc` such as `CC2603` |
| `name` | string | Human-readable project name |
| `communityId` | UUID | Main community or site |
| `status` | enum | draft, in_progress, completed, archived |
| `defaultMonitorTeamId` | UUID nullable | If monitors are repeated across many houses |
| `createdAt` / `updatedAt` | datetime | Audit trail |

### 2. `Community`

The spreadsheet repeats community names across many rows, so this should not be duplicated per house. It is a shared lookup entity.[5]

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | e.g. `Tiradentes`, `Nova Primavera` |
| `city` | string nullable | Optional future enrichment |
| `state` | string nullable | Optional future enrichment |

### 3. `Family`

A family is a first-class domain object and must stop being just a string sitting in the modal. One family may later have contacts, documents, or history. Even if today each house maps to one family, the family should still be modeled separately.[1] [5]

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | From `familia` |
| `communityId` | UUID nullable | Usually inherited from project/community |
| `primaryContactName` | string nullable | Future field |
| `primaryContactPhone` | string nullable | Future field |
| `notes` | text nullable | Future field |

### 4. `House`

This is the core editable unit inside the app. Each house should belong to one project and one family. This is the entity the editor opens.[2]

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `projectId` | UUID | Parent project |
| `familyId` | UUID | Required association |
| `communityId` | UUID nullable | Denormalized for convenience if useful |
| `houseSize` | enum/string | From `casa`, e.g. `Grande` |
| `houseType` | enum | From current app `tipo3` / `tipo6` mapping |
| `terrainType` | numeric/enum | Existing editor concept |
| `status` | enum | draft, assessed, designed, approved, built |
| `designVersion` | integer | Optimistic versioning |
| `createdAt` / `updatedAt` | datetime | Audit trail |

### 5. `SiteAssessment`

The obstacle and terrain columns are not really house geometry; they are field-survey information. This should be a separate sub-entity owned by `House`.[5]

| Field | Type | Notes |
|---|---|---|
| `houseId` | UUID | One-to-one with `House` |
| `desnivelCm` | integer | Normalize `desnivel` into centimeters |
| `hasConcreteGross` | boolean | `concreto-grosso` |
| `hasConcreteFine` | boolean | `concreto-fino` |
| `hasStone` | boolean | `pedra` |
| `hasWater` | boolean | `água` |
| `hasRoots` | boolean | `raízes` |
| `hasPipe` | boolean | `cano` |
| `hasBranches` | boolean | `galhos` |
| `hasWires` | boolean | `fios` |
| `soilNotes` | text nullable | from `solo-outro` |
| `obstacleNotes` | text nullable | from `obstaculos-outro` |

### 6. `PilotiLayout` and `PilotiPoint`

This is where the spreadsheet is especially clear: the house has a **12-position piloti matrix** (`a1` to `c4`), one master piloti, and height-derived totals.[5] The existing editor already has detailed piloti logic, so the persistence model should preserve that richness rather than collapsing it into a flat blob.[1] [2]

I would model piloti in two layers.

| Entity | Purpose |
|---|---|
| `PilotiLayout` | one record per house storing shared metadata such as master piloti and recommended metrics |
| `PilotiPoint` | one record per piloti position storing height, nivel, master flag, and position code |

Suggested structure:

| Field | Type | Notes |
|---|---|---|
| `PilotiLayout.houseId` | UUID | One-to-one with `House` |
| `masterPilotiCode` | enum | `a1` to `c4` |
| `masterHeightCm` | integer | Normalize `altura-mestre` |
| `availableHeightsCm` | int[] | Selected family/design options from the modal |
| `recommendedStrategy` | string nullable | Future traceability |

| `PilotiPoint` field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `houseId` | UUID | Parent house |
| `code` | enum | `a1`...`c4` |
| `heightCm` | integer | e.g. 150, 200, 250, 300, 350 |
| `nivelCm` | integer | Preserve editor logic |
| `isMaster` | boolean | Derived from `masterPilotiCode` |
| `xIndex` / `yIndex` | integer | Optional query convenience |

The `total-piloti-*` columns should **not** be stored as canonical data. They are summary values derived from `PilotiPoint.heightCm` and should be recalculated automatically.[5]

### 7. `HouseDrawingDocument`

This is the missing bridge between the current editor and the persisted model. Today, the app exports raw Fabric JSON only.[4] In the new architecture, each house should own a **drawing document** that stores serializable views, objects, and editor metadata — without using live Fabric groups as persisted state.[1] [2]

| Field | Type | Notes |
|---|---|---|
| `houseId` | UUID | One-to-one or one-to-many by version |
| `schemaVersion` | integer | Needed for migrations |
| `topViewJson` | jsonb nullable | Serialized drawing payload |
| `frontViewJson` | jsonb nullable | Serialized drawing payload |
| `backViewJson` | jsonb nullable | Serialized drawing payload |
| `side1ViewJson` | jsonb nullable | Serialized drawing payload |
| `side2ViewJson` | jsonb nullable | Serialized drawing payload |
| `canvasMeta` | jsonb | Zoom, guides, scale, viewport, etc. |

This is the crucial architectural distinction: **persist serializable drawing documents, not Fabric runtime objects**. The current `HouseViewInstance<TGroup>` stores a live `group`, which is fine in memory but wrong as a durable storage contract.[2]

### 8. `Person` and assignments

The sheet repeats monitors across many records, and leaders appear as concatenated text in one cell.[5] That is a sign the model should include reusable people instead of copying names and phones into every house forever.

| Entity | Why it exists |
|---|---|
| `Person` | reusable identity for monitors, leaders, volunteers |
| `ProjectLeaderAssignment` | links a person to a project as leader |
| `HouseMonitorAssignment` or `ProjectMonitorAssignment` | links a person to a house or project with role and phone |

For the first implementation, you can keep leaders as plain text if you want speed. But monitors already look like a repeatable team, so they are strong candidates for normalization.

### 9. `HouseNote`

`observações` should not be buried inside a generic JSON blob.[5] It deserves a dedicated persisted text field or note entity.

## Recommended relational model

If you want this to scale cleanly, I would use a relational schema even if the first runtime storage is local. The conceptual schema is below.

| Table | Key relations |
|---|---|
| `construction_projects` | `community_id -> communities.id` |
| `communities` | standalone lookup |
| `families` | `community_id -> communities.id` |
| `houses` | `project_id -> construction_projects.id`, `family_id -> families.id` |
| `site_assessments` | `house_id -> houses.id` |
| `piloti_layouts` | `house_id -> houses.id` |
| `piloti_points` | `house_id -> houses.id` |
| `house_drawing_documents` | `house_id -> houses.id` |
| `people` | standalone |
| `project_leader_assignments` | `project_id`, `person_id` |
| `monitor_assignments` | `project_id` or `house_id`, `person_id` |
| `house_notes` | `house_id -> houses.id` |

## How I would implement it in this codebase

I would not start by wiring a backend directly into the current singleton. I would first **separate runtime drawing state from persisted project state**, because today those layers are entangled.[1] [2] [4]

### Step 1 — Introduce a new project-level domain model

Create new types such as `ProjectState`, `PersistedHouse`, `Family`, `SiteAssessment`, `PilotiLayout`, and `HouseDrawingDocument`. Keep the current `HouseAggregate` if possible, but make it operate on a **serializable house payload**, not on a payload that embeds Fabric `group` references.[1] [2]

### Step 2 — Replace single-house persistence with project persistence

The current persistence port supports only `load(): HouseState | null` and `save(HouseState | null)`. That must become something like a project repository with list/load/save semantics and async behavior.[3]

Suggested ports:

| Port | Responsibility |
|---|---|
| `ProjectRepository` | create, list, load, save, archive projects |
| `HouseRepository` | optional if you split by aggregate, otherwise project repository is enough |
| `DrawingDocumentRepository` | save/load house drawing payloads |

A practical contract would be:

```ts
interface ProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<ProjectState | null>;
  saveProject(project: ProjectState): Promise<void>;
  createProject(input: CreateProjectInput): Promise<ProjectState>;
}
```

### Step 3 — Introduce an application shell above the editor

Right now the editor behaves like “open app, edit one house”. You need a shell like this instead:

```text
Project List
  -> Project Dashboard
      -> Houses Table / Cards
          -> Open House Editor
```

That shell should let you:

| Screen | Purpose |
|---|---|
| Project list | choose or create a construction project |
| Project dashboard | see all houses, families, status, community, monitor team |
| House editor | edit one selected house |
| Family form | create/edit family data |

### Step 4 — Keep one active house in the editor, but not one house in the whole app

This is the subtle but important move. The editor itself can still work with **one active house at a time** for simplicity, but the application must maintain a **project store** containing many houses. Selecting a house in the sidebar loads its drawing document and domain state into the editor. Saving writes back into the project store and persistence layer.

That means you do **not** need to redesign the canvas into multi-house simultaneous editing on day one. You only need to redesign the application state so the active canvas is a projection of `project.houses[selectedHouseId]`.

### Step 5 — Move family data into persisted state

The current `_familyName` and `_selectedPilotiHeights` fields in `houseManager` should disappear as loose manager fields and become persisted properties under `Family` and `PilotiLayout`/`HouseDesignSettings`.[1]

A cleaner breakdown is:

| Current temporary field | Future persisted location |
|---|---|
| `_familyName` | `Family.name` |
| `_selectedPilotiHeights` | `HouseDesignSettings.availablePilotiHeightsCm` or `PilotiLayout.availableHeightsCm` |

### Step 6 — Replace raw JSON export/import with project document export/import

Today `handleExportJSON()` exports only `canvas.toJSON()`.[4] I would replace that with a versioned project document, for example:

```json
{
  "schemaVersion": 1,
  "project": { ... },
  "families": [ ... ],
  "houses": [
    {
      "id": "...",
      "familyId": "...",
      "siteAssessment": { ... },
      "pilotiLayout": { ... },
      "drawingDocument": { ... }
    }
  ]
}
```

This file becomes both your backup format and your migration-friendly interchange contract.

## Persistence options

You asked how to leave this saved. There are three sane options, and they are not equivalent.

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| `localStorage` | fast, trivial to add | too small, fragile, poor for large drawing payloads | not enough for the full version |
| `IndexedDB` | browser-native, large enough for offline project documents | single-device unless synced later | excellent first milestone |
| Backend database + API | multi-user, durable, shareable, audit-ready | bigger implementation cost | ideal target architecture |

My recommendation is a **two-stage persistence strategy**.

### Phase A — Local-first

Use **IndexedDB** to store `ProjectState` and `HouseDrawingDocument` locally. This gives you durable persistence immediately, no server required, and enough storage for many houses plus serialized views.

### Phase B — Cloud-ready

Add a backend with authentication, relational storage, and optional file/object storage for heavy drawing payloads. Because the domain model was normalized first, the migration becomes manageable instead of theatrical.

## Recommended technical stack for the full version

Because the current app is a pure frontend, the clean long-term evolution is to move to a web app with authenticated persistence. In practice, I would adopt the following stack:

| Layer | Recommendation |
|---|---|
| Frontend | keep React + TypeScript + Vite |
| App state | TanStack Query + a project store (Zustand or equivalent) |
| Local persistence | IndexedDB via Dexie |
| Backend API | Node/TypeScript or Next.js/Express/Fastify |
| Database | PostgreSQL |
| ORM | Drizzle or Prisma |
| Auth | simple email/auth provider if needed later |
| File/version export | versioned JSON documents |

## The implementation sequence I would actually follow

The right order is to de-risk the model first and the infrastructure second.

| Milestone | Outcome |
|---|---|
| 1. Model refactor | multi-house project types exist in code |
| 2. Editor decoupling | active house can be swapped inside one project |
| 3. Local persistence | projects survive refresh/browser restart |
| 4. Project dashboard UI | user can create, list, rename, duplicate, archive houses |
| 5. Family management UI | each house is explicitly linked to a family |
| 6. Import/export v2 | whole project document can be saved/restored |
| 7. Backend sync | durable cross-device persistence |

## The shortest viable version

If you want the **fastest credible implementation**, I would do this first:

1. Introduce `ProjectState` with many houses.
2. Keep only one house open in canvas at a time.
3. Store projects in IndexedDB.
4. Add a sidebar with house list and family name.
5. Persist family + selected piloti heights inside each house record.
6. Export/import a versioned project JSON.

That already solves the core problem you described: **one construction with one or more houses, each associated with one family, and everything saved durably**.

## My direct recommendation

If the objective is to turn RAC Designer TETO into a real production-grade tool, I would implement it as a **project-based editor** with this core rule:

> A construction project contains many houses. Each house belongs to exactly one family. Each house has its own assessment data, piloti layout, and drawing document. The editor loads one active house at a time, but persistence always happens at project level.[1] [2] [3] [4] [5]

That gives you the cleanest path from today’s single-house prototype to a real system, without tearing out the current editor logic unnecessarily.

## Suggested next concrete step

The most valuable next step is not coding blindly. It is to freeze the **target schema** and then implement the first local-persistence milestone.

I recommend that the next execution task be:

| Priority | Task |
|---|---|
| 1 | create the `ProjectState` / `PersistedHouse` / `Family` TypeScript contracts |
| 2 | refactor `houseManager` into a project-aware service with `activeHouseId` |
| 3 | add IndexedDB persistence for projects |
| 4 | add a left sidebar listing houses and linked families |
| 5 | replace current JSON import/export with versioned project documents |

If you want, I can do the next step end-to-end: I can **design the exact TypeScript interfaces, repository contracts, IndexedDB schema, and UI flow**, and then start implementing the first milestone in this repository.

## References

[1]: file:///home/ubuntu/rac-designer-teto/src/components/rac-editor/lib/house-manager.ts "Current single-house manager with in-memory persistence and non-persisted family fields"
[2]: file:///home/ubuntu/rac-designer-teto/src/shared/types/house.ts "Current HouseState type used by the editor"
[3]: file:///home/ubuntu/rac-designer-teto/src/domain/house/house-persistence.port.ts "Current persistence port limited to a single house"
[4]: file:///home/ubuntu/rac-designer-teto/src/components/rac-editor/hooks/useRacEditorJsonActions.ts "Current canvas-only JSON import/export flow"
[5]: https://docs.google.com/spreadsheets/d/16ZYrcTcABqMJAK7_URahCg_h2ZfC_yYWJvZyeRBhbm8/edit?gid=0#gid=0 "Reference Google Sheet used to infer house data groups and persistent entities"

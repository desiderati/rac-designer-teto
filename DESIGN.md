# Design System: RAC Designer TETO

**Project ID:** `12694201971562418000`

## 1. Product Design Thesis

RAC Designer TETO is a two-surface professional tool: the **Construction Manager** organizes TETO construction projects,
houses, families, photos, dates, location data, and lifecycle status; the **RAC Editor** is the precise drawing
workspace where the active house is composed, reviewed, exported, and inspected in 3D.

The shared visual direction is **The Technical Architect**. The product should feel like a high-fidelity instrument for
construction planning, not a generic dashboard and not an intimidating CAD suite. The interface should balance three
qualities:

- **Operational clarity:** people must understand where they are, what is active, and what will be saved.
- **Spatial precision:** canvas, measurements, house views, and 3D review must feel exact and controlled.
- **Volunteer guidance:** forms, empty states, blocked actions, and onboarding cues must teach without slowing down
  experienced users.

Both surfaces should share a light technical atmosphere, crisp blue accents, quiet neutral materials, rounded geometry,
and restrained depth. The Construction Manager may be more editorial and form-led; the RAC Editor may be more
instrument-like and floating. They are siblings, not twins.

## 2. Source Surfaces

### Construction Manager

The Construction Manager covers:

- construction list, create, edit, archive, and unarchive flows;
- house list, create, edit, archive, and unarchive flows;
- family identity, photo upload, contact fields, notes, site conditions, location coordinates, map preview, terrain
  complexity, soil profile, and status;
- responsive list cards on mobile and compact tables on wider screens.

Its job is administrative but not generic. It should feel like organizing real field work for a TETO construction, with
strong continuity back to the canvas.

### RAC Editor

The RAC Editor covers:

- the 2D Fabric canvas, house views, element insertion, line and measure tools, selection, panning, zoom, history, and
  contextual editing;
- the floating top bar, family name, construction and house selector, zoom menu, 3D action, PDF export, and user menu;
- the left-side vertical tool rail and contextual submenus;
- 3D preview and snapshot insertion into the 2D canvas.

Its job is precision work. It should feel like a technical workstation with enough warmth and clarity for volunteers.

## 3. Visual Theme and Atmosphere

The overall mood is **bright, technical, layered, and calm**. Use a light-mode technical workspace because the primary
task is daytime drawing, field review, and shared inspection on common screens. The UI should feel legible under
ordinary ambient light rather than cinematic or dark.

The product rejects the default SaaS card grid. The Construction Manager can use cards and tables where they are real
affordances, but they must be compact, purposeful, and tied to actions. The RAC Editor should use floating controls,
blueprint grids, and layered panels that preserve the canvas as the main object.

Use **modular asymmetry** as the system's compositional principle. Avoid centered decorative layouts. Prefer weighted
sidebars, offset blocks, compact control groups, and clear spatial zones.

## 4. Color Palette and Roles

Use the current light technical palette as the canonical direction. The palette may be implemented through HSL tokens in
code, but design prompts should describe colors semantically.

- **Architectural Blue** (`#004ac6`): core primary action color and technical identity anchor.
- **Action Blue** (`#2563eb`): high-confidence CTA color for export, save, active action, selected state, and key
  affordances.
- **Soft Blueprint Blue** (`#dbeafe` / `#eff6ff`): active list rows, selected houses, input backgrounds, focus halos,
  and lightweight instructional emphasis.
- **Blueprint Surface** (`#f1f5f9`): gridded application workspace behind both the manager shell and the canvas.
- **Porcelain Surface** (`#faf8ff`): clean light surface for floating bars and primary content panels.
- **Container Low** (`#f2f3ff`): secondary panel background and quiet grouping surface.
- **Container High** (`#e2e7ff`): elevated controls, active zones, and stacked surfaces.
- **Ink Slate** (`#131b2e` / `#0f172a`): primary text, dense labels, and high-emphasis content.
- **Muted Slate** (`#64748b`): secondary text, hints, field descriptions, inactive icons.
- **Amber Status** (`#f59e0b` family): in-progress construction status and cautionary field-work states.
- **Emerald Status** (`#10b981` family): completed construction states and successful outcomes.
- **Violet Status** (`#8b5cf6` family): RAC printed status, used sparingly for lifecycle distinction.
- **Danger Red** (`#dc2626` / `#ba1a1a`): destructive actions and irreversible confirmations.

Do not let the UI become monochrome blue. Blue is the product anchor, not the only voice. Use amber, emerald, violet,
and red for real state semantics only.

## 5. Typography Rules

Use **Inter** as the reliable product font for body text, labels, tables, menus, forms, and dense operational UI. It
should carry most of the product because the tool is used repeatedly and must scan quickly.

Use **Space Grotesk** only where a technical signature is useful: page titles, family name display, major tool labels,
or high-level editor identity. It should add engineered character without turning every label into display type.

Use a compact hierarchy:

- large headings only for screen identity, not for every card or fieldset;
- section titles should be short and functional;
- table and card metadata should be small, high-contrast, and easy to scan;
- form labels should be concise and consistent;
- error text should explain the fix, not merely state failure.

Avoid ornamental typography, oversized hero type, and marketing copy. This is a working tool.

## 6. Geometry, Depth, and Material

Use rounded geometry consistently, but match the radius to the surface:

- **Pill shapes:** floating top-bar buttons, avatars, primary canvas actions, compact status controls.
- **Soft rounded rectangles:** Construction Manager cards, mobile list items, form fields, popover menus, map previews.
- **Large rounded shells:** manager content container and image upload zones.
- **Small radii:** dense internal controls, checkboxes, and table action buttons.

Depth should come from tonal layering first, shadow second. Shadows must be ambient and soft, never heavy. Floating
elements may use white translucency and backdrop blur when they sit above the canvas. Manager forms should be more solid
and calmer.

Use borders as a fallback, not as the main sectioning device. When borders are necessary, keep them low-contrast and
functional. Prefer background shifts, spacing, and grouping to separate sections.

## 7. Shared Component Styling

### Buttons

Primary actions use Action Blue with white text and a restrained shadow. Secondary actions use quiet slate or white
surfaces. Destructive actions use red only when the consequence is real. On mobile, buttons should use stable widths and
clear tap targets.

### Inputs and Forms

Inputs should use Soft Blueprint Blue backgrounds by default, turning white on focus with a clear blue focus ring. Form
labels should be short, uppercase only when density benefits scanning, and paired with helpful placeholder copy. Avoid
large explanatory blocks inside forms.

### Select Menus

Use visual popover selects instead of native selects for product-facing filters and field choices. Menus should use
white translucent surfaces, compact rounded rows, selected check marks, and truncation for long labels.

### Status Badges

Badges should be small, rounded, and semantically colored. Use:

- amber for `In progress`;
- emerald for `Completed`;
- slate for `Archived`;
- blue for `Draft`;
- violet for `RAC printed`;
- dark slate for `Built`.

Badges should help scanning, not dominate cards.

### Cards and Tables

Use cards for repeated items on mobile and tables for wider screens when comparison matters. Mobile cards should show
identity, status, key metadata, and the primary action without reproducing every desktop column. Tables should use
separate row spacing and rounded row edges rather than dense grid lines.

### Empty States

Empty states must tell users what is missing and what they can do next. Use calm language and avoid decorative
illustration unless it directly clarifies the construction or house state.

## 8. Surface Rules: Construction Manager

The Construction Manager should feel like a **field operations console**. It is not a dashboard homepage. It is a
focused workspace for managing TETO constructions and houses before returning to the RAC Editor.

### Layout

Use a centered, bounded shell over the gridded workspace. The current maximum width around `4xl` is appropriate because
the form and list content should remain readable. Keep the header compact: back action, title, contextual subtitle, and
one primary action.

The screen sequence should remain clear:

- construction list;
- create or edit construction;
- house list;
- create or edit house;
- return to canvas only when a valid active house exists.

Do not put the canvas toolbar or drawing submenus inside the manager. The manager is a separate mode.

### Construction List

Desktop uses a compact table with spaced rounded rows. Mobile uses rounded cards. Filters and sorting should remain
near the list, not in a global toolbar. Pagination should sit close to the list it controls.

Each construction item should emphasize:

- Construction code;
- Community;
- Construction date when available;
- Status;
- House count or active-house context when useful;
- Archive or unarchive action.

### House List

House items should be family-first. A house is identified by its associated family, not by a standalone house name.
Status, house type, last modification, and active state are secondary. Active houses should receive a quiet blue
selection treatment.

### Forms

Forms should feel stable and approachable. Use two-column layouts only when there is enough width; mobile should stack
without squeezing labels or controls.

Construction forms should privilege:

- photo;
- Construction code;
- construction date;
- community.

House forms should privilege:

- family identity;
- family photo;
- contact data;
- notes;
- site assessment;
- map preview;
- obstacles and terrain.

### Photo Uploads

Photo fields are content surfaces, not decorative image cards. Use fixed crop boxes, soft rounded corners, visible
upload affordance, and a separate remove action. Replacing an image and removing an image must feel like different
actions.

### Map Preview

The map preview should be a calm location panel. When Google Maps is unavailable or coordinates are invalid, use a
structured fallback with a pin, grid, and precise explanation. Never leave an empty rectangle.

### Mobile

Mobile must prioritize scannability and touch. Use cards, compact controls, stable pagination, and no bottom navigation
unless the product adds a true global mobile nav. Do not introduce floating actions that compete with the return path or
form actions.

## 9. Surface Rules: RAC Editor

The RAC Editor should feel like a **technical drawing workstation**. The canvas is the main object. Every control should
either help draw, navigate, review, export, or manage the active house context.

### Workspace

Use a blueprint-style grid behind the canvas. The grid should support spatial reading without becoming decorative noise.
The editable drawing surface should feel crisp, bounded, and stable.

### Floating Top Bar

The top bar has three zones:

- left: hamburger menu and family name;
- center: zoom and canvas navigation tools;
- right: 3D, PDF export, and user menu.

Keep these zones visually separated through placement, not heavy dividers. The top bar can use glassy white surfaces and
soft blur because it floats over the canvas.

### Hamburger Menu

The hamburger menu is the bridge from the editor back to construction context. It must show `Construções TETO` first,
then active constructions grouped by code and community, then houses under each construction. It must not become a
generic overflow menu.

### Family Name

The family name is part of the active-house identity. It should read like a project label, not a page heading. Editing
affordance can be subtle, but the active family must remain visible in the editor.

### Left Tool Rail

The side rail should remain narrow, vertical, and icon-first. Use compact grouping and clear active states. Avoid text
labels in the rail unless a contextual submenu needs them.

### Zoom and Canvas Modes

Zoom, select, pan, and fit-to-view should feel like instrument controls. Show keyboard shortcuts only where they help
desktop users and do not clutter mobile.

### 3D and Export

3D is a review action. Export is an output action. Keep them visually distinct from drawing tools. The export button can
carry the strongest CTA treatment because it produces a deliverable.

### Modals and Contextual Editors

Contextual editors for pilotis, measures, lines, walls, and house settings should preserve the user's sense of where the
selected object lives. Avoid large generic modals when a contextual panel or floating editor can keep continuity.

## 10. Cross-Surface Navigation

The transition between Construction Manager and RAC Editor must preserve state. The user should always understand:

- which Construction TETO is active;
- which house is active;
- whether returning to canvas is available;
- why the RAC Editor cannot open when there is no active construction with an active house;
- whether a house switch will restore a saved drawing.

The Construction Manager should not expose drawing tools. The RAC Editor should not expose full CRUD forms. Each surface
should link to the other at the moment of need.

## 11. Interaction and State Rules

Use explicit feedback for:

- archive and unarchive actions;
- destructive or high-impact actions;
- invalid construction codes;
- invalid map coordinates;
- blocked view insertion;
- invalid piloti levels;
- bracing eligibility;
- unavailable canvas return;
- 3D snapshot failure;
- successful save or restoration when the user needs confirmation.

Blocked actions must explain the rule in the user's vocabulary. Avoid implementation language such as adapter, runtime,
Fabric object, or schema unless the screen is explicitly technical.

## 12. Do's and Don'ts

### Do

- Do make the two surfaces visually related through color, type, radius, and tone.
- Do let the Construction Manager be calmer, more form-led, and more administrative.
- Do let the RAC Editor be more floating, spatial, and instrument-like.
- Do use blue as the action and precision anchor.
- Do use status colors only for real lifecycle meaning.
- Do keep mobile flows dense but not cramped.
- Do preserve the grid workspace as a shared spatial signature.

### Don't

- Don't force manager CRUD screens into the same floating toolbar model as the RAC Editor.
- Don't turn the RAC Editor into a dashboard with generic panels.
- Don't use decorative metrics unless they directly help construction or house management.
- Don't mix construction management, drawing, export, 3D, and user preferences into one menu.
- Don't use raw Fabric JSON, internal persistence terms, or architectural vocabulary in product-facing UI.
- Don't let borders and shadows become the main visual system.
- Don't use pure black text or pure white surfaces when a tinted neutral token is available.

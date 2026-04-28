# Design System Specification: The Technical Architect

## 1. Overview & Creative North Star

**Creative North Star: "The Technical Architect"**
This design system moves beyond the generic "SaaS dashboard" aesthetic to create a high-fidelity instrument for
precision work. Inspired by the meticulous nature of code editors and professional engineering tools, the visual
language balances the clarity of a high-contrast light-mode technical interface with the premium feel of editorial
typography.

We break the "template" look by favoring **Modular Asymmetry**. Instead of a centered, symmetrical grid, we use weighted
sidebars and offset content blocks that feel like a bespoke physical workspace. The interface doesn't just display data;
it "houses" it within a series of interlocking, layered surfaces.

---

## 2. Colors & The "No-Line" Philosophy

The palette is rooted in crisp neutrals and electric blues, engineered for clarity, readability, and high visual
hierarchy.

### The "No-Line" Rule

To achieve a premium, high-end feel, **1px solid borders are strictly prohibited for sectioning.** Traditional lines
clutter the interface and feel "cheap." Instead:

* **Boundaries** must be defined solely through background color shifts.
* Use `surface_container_low` against a `surface` background to denote a new section.
* Use `surface_container_highest` for active or focused states.

### Surface Hierarchy & Nesting

Treat the UI as a physical stack of materials.

* **Base:** `surface` is your clean, light canvas.
* **Secondary Panels:** Use `surface_container_low` for the two-column layout sections.
* **Interactive Cards:** Use `surface_container` or `surface_container_high`.
* **Nesting:** A container should always be at least one tier lighter or darker than its parent to provide "tonal depth"
  without needing a stroke.

### The Glass & Signature Texture

* **Glassmorphism:** For context-aware menus and floating bars, use semi-transparent surface colors (e.g.,
  `surface_bright` at 80% opacity) with a `backdrop-filter: blur(24px)`.
* **CTAs:** Main action buttons should not be flat. Apply a subtle linear gradient from `primary_container` to
  `primary` (#2563EB) at a 45-degree angle to give the element "soul" and a slight metallic sheen.

---

## 3. Typography

The system uses a high-contrast pairing of **Space Grotesk** and **Inter**.

* **Display & Headlines (Space Grotesk):** This typeface provides the "technical" soul. Its geometric apertures feel
  engineered. Use `display-lg` (3.5rem) for hero moments and `headline-sm` (1.5rem) for section headers.
* **Body & Labels (Inter):** Chosen for its neutrality and supreme legibility at small scales.
* **The Brand Voice:** By using `label-sm` (0.6875rem) in all caps with a 0.05em letter spacing for metadata, we evoke
  the feeling of a blueprint or a technical schematic.

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than traditional structural shadows.

* **The Layering Principle:** Depth is achieved by "stacking" the surface tiers. A `surface_container_lowest` card
  sitting on a `surface_container_low` background creates a natural recession.
* **Ambient Shadows:** If a floating element (like a FAB) requires a shadow, it must be "Ambient."
    * Blur: 32px to 64px.
    * Opacity: 4% - 8%.
    * Color: Use a soft tinted shadow based on the neutral palette rather than pure black.
* **The "Ghost Border" Fallback:** If a container requires definition against a similar background (for accessibility),
  use the `outline_variant` token at **15% opacity**. This creates a hint of an edge that disappears into the
  background.

---

## 5. Components

### Floating Action Buttons (FABs)

* **Shape:** `rounded-pill` (using `roundedness: 3`).
* **Style:** `primary_container` background with `on_primary_container` icons.
* **Interaction:** On hover, shift the background to a subtle gradient and increase the ambient shadow spread.

### Vertical Toolbars

* **Structure:** Located on the far left or right of the secondary column.
* **Styling:** Use `surface_container_high` with no borders. Use vertical white space (standardized by `spacing: 2`) to
  group icons logically.
* **Active State:** Use a 2px vertical "indicator" in `primary` blue next to the active icon, rather than highlighting
  the whole square.

### Navigation Bar

* **Aesthetic:** Sleek and horizontal.
* **Separators:** Do not use lines. Use a `surface_bright` vertical block (width: 1px, height: 40%) at 20% opacity to
  create a "ghost separator."

### Inputs & Fields

* **Background:** `surface_container_highest`.
* **State:** When focused, change the background to `surface_bright` and add a "Ghost Border" using the `primary` color
  at 30% opacity.
* **Typography:** Use `body-md` for user input and `label-sm` for field titles.

### Cards & Lists

* **Rule:** Forbid the use of divider lines.
* **Separation:** Use standard spacing (`spacing: 2`) between cards. For lists, use alternating tonal shifts (zebra
  striping) using `surface` and `surface_container_low` for a more sophisticated look.

---

## 6. Do's and Don'ts

### Do:

* **Do** use asymmetrical layouts. A narrow left column (tooling) and a wide right column (canvas) creates a
  professional, "workstation" feel.
* **Do** leverage "Negative Space." With `spacing: 2`, ensure the layout feels balanced and organized, not cramped.
* **Do** use `tertiary` for "Warning" or "Special Interest" callouts to break the blue/neutral monotony.

### Don't:

* **Don't** use 100% opaque borders. It breaks the "Physical Material" illusion.
* **Don't** use heavy shadows. In light mode, shadows should be nearly invisible "ambient occlusion" effects.
* **Don't** use pure black for text. Always use the `on_surface` tokens to maintain the technical depth of the neutral
  palette.

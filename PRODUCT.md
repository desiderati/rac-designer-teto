# Product

## Register

product

## Users

RAC Designer TETO serves volunteer monitors, volunteer leaders, and first-time volunteers who need to draw, review, and
understand TETO house projects.

Volunteer monitors use the tool to create precise floor plans, configure house views, edit pilotis, bracing, measures,
and structural elements, export RAC material, and keep drawing state consistent throughout the work. Volunteer leaders
use the 3D view and project state to validate plans, review construction intent, and reduce ambiguity before execution.
First-time volunteers need progressive guidance, clear messages, and an interface that teaches the workflow without
assuming prior technical drawing experience.

The product is used in a mixed context: professional precision work, field operation, and volunteer onboarding. The
interface must work well on desktop, tablet, and mobile while preserving useful drawing space, clear visual feedback,
and accessible commands as people move between the Construction Manager, houses, the RAC Editor canvas, 3D review, and
export flows.

## Product Purpose

The product exists to turn the creation and review of TETO RACs into a precise, visual, local-first, and operationally
safe workflow. It lets users manage TETO construction projects, organize multiple houses by construction, associate
houses with families, draw the active house in a 2D canvas, keep structural rules coherent, view the result in 3D, and
persist the latest state of each house.

Success means a user can create or open a TETO construction project, manage houses associated with families, edit the
active house drawing, switch between houses without losing state, review the 3D representation, and export supporting
material without breaking business rules, house-view limits, piloti consistency, bracing rules, or the canonical house
drawing document.

The product has two primary surfaces. The Construction Manager organizes construction projects, houses, families,
photos, dates, location data, and lifecycle status. The RAC Editor remains the main workspace whenever a valid house is
available for drawing. These surfaces must feel connected, but they must not collapse into the same interaction model.

## Brand Personality

Precise, constructive, and guiding.

The experience should feel like a professional technical tool serving a concrete social operation: disciplined enough
to protect construction rules, clear enough to welcome volunteers without technical experience, and refined enough to
build trust without turning the product into a marketing showcase.

The product voice should be calm, direct, and instructional. Errors, blocked actions, destructive confirmations, empty
states, and success messages should explain the reason behind the action in plain language, especially around house
views, pilotis, bracing, active-house restoration, construction archive flows, and 3D snapshots.

## Anti-references

- Generic SaaS dashboards with decorative cards, empty metrics, and landing-page hierarchy.
- Intimidating CAD software that exposes configuration before it is needed.
- Drawing tools that privilege visual freedom while ignoring product-specific structural rules.
- Administrative CRUD pages that feel disconnected from the drawing workspace.
- Destructive flows without confirmation, blocked actions without a reason, or errors that assume technical knowledge.
- Navigation that mixes construction management, canvas tools, export, 3D, and user preferences into one undifferentiated
  command surface.
- Noisy UI decoration, heavy borders, and shadows that compete with the spatial reading of the canvas.
- Treating raw Fabric JSON as the product contract or bringing JSON import/export back as the main navigation model.

## Design Principles

1. Protect the work before accelerating the command.
   The interface must block invalid states, confirm destructive actions, preserve history, and explain limits without
   interrupting the main flow unnecessarily.

2. Teach through use.
   Contextual tips, empty states, error messages, and visual feedback should reduce the learning curve for first-time
   volunteers without talking down to experienced monitors and leaders.

3. Surface structural rules at the moment of decision.
   Rules for views, levels, pilotis, single master piloti, bracing, and 3D synchronization should appear where they
   affect user decisions, not as detached documentation.

4. Preserve operational continuity.
   Moving between TETO constructions, houses, the Construction Manager, and the RAC Editor must keep the active house
   understandable, restore the correct drawing, and make it clear when returning to the canvas is available.

5. Separate management, drawing, and review without fragmenting the product.
   Construction management, 2D editing, 3D viewing, and export should have distinct responsibilities while sharing
   language, state, and feedback so they feel like parts of the same tool.

## Accessibility & Inclusion

The tool must prioritize clarity, predictability, and responsiveness for users with different levels of technical
experience. The experience needs to work across desktop and mobile devices, with useful workspace preserved, controls
kept proportionate, visible feedback, and interaction alternatives for mouse, keyboard, touch, and gestures.

Active, disabled, destructive, empty, error, and success states should be perceivable through more than color alone:
text, position, iconography, visual state, and interaction feedback should reinforce one another. Contrast, visible
focus, clear labels, and actionable messages are part of the product contract, not optional polish.

Motion, transitions, and tips should orient without getting in the way. Critical interactions such as archiving,
unarchiving, restarting, ungrouping, removing views, changing pilotis, switching houses, and inserting 3D snapshots must
preserve user comprehension and control.

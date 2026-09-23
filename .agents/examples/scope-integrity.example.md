# Scope Integrity Example

## Scenario

A preflight reports ten pending exports. The user then asks about six schedule changes contained in
that result.

## Incorrect contraction

Treating the six schedules as the complete export set silently drops four unresolved items. The
conversation changed focus, not the authorized universe.

## Correct scope ledger

- `total_universe`: ten pending exports;
- `focus_subset`: six schedule changes;
- `restriction_source`: `analysis_only`;
- `unresolved_remainder`: four other exports.

## Correct response shape

State that ten exports remain pending, identify the six schedules as the current focus, and preserve
the other four in the decision. Ask for explicit direction only if the next operation would exclude,
defer, cancel, or replace those four items.

## Contract check

- A subset may receive temporary attention without becoming the whole task.
- Tool selection limits do not silently rewrite user-authorized scope.
- Both implicit contraction and implicit expansion require a checkpoint before operational impact.

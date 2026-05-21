# UI Polish Audit Findings and Fixes v1

## Findings

- Parent and Teacher still contain inline UI styles, so some button shapes and typography can drift.
- Notification badges need a fixed numeric alignment system: 18px height, centered flex, line-height 1, tabular numbers.
- Report-related buttons should be quiet secondary actions, not black primary actions.
- Parent/Teacher roots need stable class hooks so future UI alignment can be done cleanly without broad rewrites.
- The current colour direction should stay soft: `#FCFCFF` page background, `#F4F4F6` muted buttons, `#1A1A1A` text.

## Applied changes

- Parent: app root class added
- Teacher: app root class added
- Parent: softened 1 report-related button(s)
- Teacher: softened 2 report-related button(s)
- Parent: checked red notification badges; patched 0 badge style block(s)
- Teacher: checked red notification badges; patched 3 badge style block(s)
- ClassSpacePrimitives: normalised shared tab badge centering (1)
- mobile-safe-area.css: polish CSS layer added

## Next recommended cleanup

Move Parent and Teacher message composers into one shared component after this pass is visually approved.

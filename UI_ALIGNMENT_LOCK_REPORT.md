# UI Alignment Shapes Pass v1

## Scope

Focused shape alignment only.

## What changed

- Added stable composer dock classes to Parent and Teacher where found.
- Added stable composer shell classes to Parent and Teacher where found.
- Normalised message composer button sizes near the active message textarea.
- Added one CSS layer in `mobile-safe-area.css` for consistent composer thickness, radius, button size and icon alignment.
- Did not change APIs, routes, database/schema, send logic, broadcast logic or class post logic.

## Parent class changes

- parent composer dock class
- parent composer shell class

## Teacher class changes

- teacher composer dock class
- teacher composer shell class

## Parent inline changes

- none

## Teacher inline changes

- none

## CSS changed

True

## Next cleanup target

After testing, migrate the two active message composers into a shared component instead of continuing to carry inline style differences.

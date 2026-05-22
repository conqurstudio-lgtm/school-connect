# School Life Admin Images v3

## Applied changes

- Replaced ActivityCard safely and repaired any orphan function fragment
- Teacher context enrichment already exists

## Image behaviour

- Single image now uses the teacher/feed strategy: large 260px image aligned with the post text column.
- Multiple images now use a soft horizontal scroll.
- First image starts in the normal post image position.
- Next images peek from the right so the admin can swipe naturally.
- Images use larger rounded corners and fill their containers.

## Scope

- Repairs the previous ActivityCard build issue if it exists.
- No API route changes.
- No database/schema changes.
- No parent/teacher message changes.
- No composer/safe-area changes.

# Parent Feed Linked Child Simple v2

## Applied changes

- Replaced `/api/feed` with a simpler, safer linked-child strategy.
- Parent feed now uses `child_guardians` first.
- If no guardian link exists yet, it falls back to `profiles.child_name` and the `children` table.
- Parent sees school-wide posts from their school.
- Parent sees teacher posts only when a linked/resolved child matches the teacher post grade/class or teacher id.
- Added `?debug=1` to show `child_source`, `resolved_children`, `parent_profile` and `post_count`.

## Why this simplifies things

This removes the confusion of depending only on `profiles.child_grade`, which is currently null for your parent accounts. The feed now follows the proper product model: parent -> child_guardians -> children -> class feed.

## Scope

- API feed route only.
- No UI changes.
- No database/schema changes.
- No message/composer changes.

# Parent Feed Teacher Posts v1

## Applied changes

- Replaced `/api/feed` with a parent class-aware feed reader.
- Parent feed now resolves the parent's child from `profiles.child_name` and the `children` table.
- Parents see school-wide posts from their school.
- Parents see teacher posts only when the post matches the child's grade/class or the child's assigned teacher.
- Parent feed keeps reaction counts, my reaction and comment counts.
- Added `?debug=1` support so the resolved child can be checked safely during testing.

## Why this fixes it

Teacher posts are saved with `audience_grade` and `audience_class`, while parent profiles currently have `child_grade = null`. This route now resolves the grade/class from the `children` table using the parent profile's `child_name`.

## Scope

- API feed route only.
- No database/schema changes.
- No Parent/Teacher UI changes.
- No message/composer changes.

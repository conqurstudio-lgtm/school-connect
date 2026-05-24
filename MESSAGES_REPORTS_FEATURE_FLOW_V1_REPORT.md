# Messages + Reports Feature Flow v1

## Applied changes

- Parent thread is no longer marked as seen during page load; it clears only when Messages or Child reports are opened
- Parent thread-status now counts published child reports as unread parent items
- Creating/updating a child report now flags linked parents through teacher_parent_threads

## Why this matters

- Before this patch, parent unread state could be cleared simply by loading the class page.
- Child reports were created, but they were not counted in parent thread-status/unread flow.
- Now reports can participate in the same parent notification/unread flow without adding a new table.

## Behaviour after patch

- Parent opens class page: messages/reports are not automatically marked as read.
- Parent opens Messages or Child reports: that teacher thread is marked seen.
- Teacher creates or updates child report: linked parents are flagged as having new activity.
- `/api/thread-status` includes published child reports when calculating parent unread count.

## Scope

- Parent seen-state logic.
- Parent thread-status logic.
- Teacher child-report route after-save notification flag.
- No feed/post layout changes.
- No database/schema changes.
- No UI redesign.

## Files changed

- src/components/feed/TeacherProfileClient.tsx
- src/app/api/thread-status/route.ts
- src/app/api/teacher/child-report/route.ts

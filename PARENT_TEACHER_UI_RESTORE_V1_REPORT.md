# Parent Teacher UI Restore v1

## Applied changes

- Restored the teacher header/profile UI from the pre-shell backup only; feed and feature logic remain current
- Restored the parent top/profile UI from the pre-shell backup only; parent claim flow, feed work, messages and reports remain current
- Restored shared Teacher/Parent category tabs from the pre-shell backup only

## What was intentionally preserved

- Feed/post rendering changes were not touched.
- Parent child claim flow was not touched.
- Messages, reports and notifications were not touched.
- API/database changes were not touched.
- Only UI shell/header/category regions were restored from the earlier backup.

## Backup source

- Used latest backup folder: `.school-ui-shell-carryover-v1-backup-20260524022950`

## Files changed

- src/components/teacher/TeacherSelfProfile.tsx
- src/components/feed/TeacherProfileClient.tsx
- src/components/class-space/ClassSpacePrimitives.tsx

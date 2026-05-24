# School UI Shell Carryover v1

## Applied changes

- Simplified shared Teacher/Parent category tabs to match the clean School UI pill style
- Carried the School profile visual rhythm into the Teacher header without changing the feed
- Carried the School profile visual rhythm into the Parent class header without changing the feed

## Design rule

- The School profile page remains the visual standard.
- Teacher and Parent inherit its clean header rhythm, soft typography and simple category pills.
- Feed/post layouts are not redesigned in this patch.
- Message/composer behaviour is not touched.

## Scope

- Teacher header/profile area.
- Parent class header/profile area.
- Shared category/tabs style.
- No API changes.
- No database/schema changes.
- No feed post component changes.

## Files changed

- src/components/class-space/ClassSpacePrimitives.tsx
- src/components/teacher/TeacherSelfProfile.tsx
- src/components/feed/TeacherProfileClient.tsx

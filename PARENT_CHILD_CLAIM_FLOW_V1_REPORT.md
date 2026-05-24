# Parent Child Claim Flow v1

## Applied changes

- /api/class-join now links the parent to an existing child in the teacher's class immediately instead of creating a pending request
- /api/onboarding/link now stores child_name and child_grade on the parent profile after claiming
- Parent class modal now says Claim child and no longer describes teacher approval

## New product behaviour

- Teacher adds children to the class first.
- Teacher shares the class link with parents.
- Parent enters their name, phone and child name.
- `/api/class-join` searches only that teacher's class roster.
- If the child exists in that class, the parent is linked immediately through `child_guardians`.
- No pending teacher approval is created for this class-link flow.
- Parent can immediately enter School Life, messages and reports for that class.

## Important note

This version does not create a child from the parent form. The child must already exist in the teacher's class list. That keeps the WhatsApp class link safer.

## Scope

- Class join route.
- School invite child linking route profile update.
- Parent class join modal wording.
- No feed layout changes.
- No message/composer changes.
- No database/schema changes.

## Files changed

- src/app/api/class-join/route.ts
- src/app/api/onboarding/link/route.ts
- src/components/feed/TeacherProfileClient.tsx

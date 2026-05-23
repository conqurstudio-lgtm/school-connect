# Parent School Life Home v1

## Applied changes

- Reframed `/feed` as the Parent School Life home.
- Removed school/admin feed controls from the parent home UI.
- Removed the old school profile sheet and teacher management entry points from parent home.
- Added a clean School Life header with school logo, notifications and sign out.
- Added parent actions for Messages and Child reports.
- Kept the existing post loading hook and PostCard rendering so feed content logic remains untouched.
- Kept role locking: school users go to `/school`, teacher-token users go to `/teacher`, parents stay here.

## Important note

The internal route is still `/feed` for now, but the product UI no longer presents it as Feed. It is Parent School Life. We can add `/school-life` later as a friendly alias after the flow is stable.

## Scope

- Parent home UI only.
- No `/api/feed` changes.
- No parent-child linking changes.
- No database/schema changes.
- No message composer changes.

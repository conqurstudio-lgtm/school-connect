# School Signup Parent Invite Only v1

## Applied changes

- Removed the generic Parent option from `/auth/signup`.
- Generic signup now creates school accounts only.
- Parent account creation still works when the user arrives from a parent invitation redirect.
- Added a clear message explaining that parents must use the private school/teacher invitation link.
- Kept the school setup redirect for school accounts.

## Why

The public Parent signup option created a dead-end because parents must be linked to a school/class/child. A parent should not create a standalone account without an invitation or approval path.

## Scope

- Signup page only.
- No database/schema changes.
- No feed/query changes.
- No message/composer changes.

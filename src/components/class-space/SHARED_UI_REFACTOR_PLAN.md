# School Connect Shared UI Refactor Plan

We are moving away from patching Parent and Teacher separately.

## Design principle

One product. One visual system. Different tools.

Parent and Teacher should share:
- mobile shell width
- category tab sizing
- button height and radius
- input shape and focus feel
- list row style
- card spacing
- message text sizing

## Current direction

Parent:
- Class Life
- Messages
- Reports

Teacher:
- Class Life
- Messages
- Children
- Requests
- Invite
- Reports later

## Refactor phases

### Phase 1: Add shared primitives
Create reusable UI primitives without replacing screens immediately.

### Phase 2: Migrate tabs
Use the same `ClassSpaceTabs` for Parent and Teacher.

### Phase 3: Migrate buttons and inputs
Use the same button/input style for:
- Join form
- Add Child overlay
- Class composer
- Broadcast
- Request approve/reject actions

### Phase 4: Migrate message lists
Teacher messages become a clean inbox/list:
- parent name
- child name
- latest preview
- time
- unread badge/dot
- divider lines

### Phase 5: Simplify teacher invite/children area
Teacher invite should focus on:
- class link
- copy/share
- add child
- pending requests
- child list

### Phase 6: Larger teacher rebuild
Once primitives are stable, rebuild teacher from the parent class-space shell and add teacher-only tools.

## Added to migration list

### Shared app-screen feel
Teacher must use the same mobile shell feeling as Parent:
- same max width
- same full-height app container
- same background
- same sticky top behavior
- same safe top padding pattern
- same profile header spacing

### Shared top profile/header
Parent and Teacher top profiles should match:
- same avatar size
- same title size
- same subtitle size
- same action button size
- same text weight
- same header spacing

This will be migrated after shared controls are stable.

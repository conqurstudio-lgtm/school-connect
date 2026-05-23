# Unified Class Life Post Card v1

## Applied changes

- Created one shared UnifiedClassLifePostCard used by both teacher and parent class life
- TeacherClassPostCard now uses the shared class life layout
- Parent ClassLifePostCard now uses the exact same shared class life layout with reactions enabled

## Behaviour

- Teacher class life and Parent class life now render through one shared post card component.
- Parent and teacher no longer have separate class post layouts.
- Parent can react from the shared card.
- Teacher sees the same card layout, with delete action available.
- Reaction counts can show on teacher cards when the data includes reaction counts.
- Image opening remains full-screen and dark.

## Why

This prevents future layout drift. Any future visual change to class posts should now be made in `src/components/class-life/UnifiedClassLifePostCard.tsx` only.

## Scope

- Class life post cards only.
- No API route changes.
- No database/schema changes.
- No message/composer changes.

## Files changed

- src/components/class-life/UnifiedClassLifePostCard.tsx
- src/components/teacher/TeacherSelfProfile.tsx
- src/components/feed/TeacherProfileClient.tsx

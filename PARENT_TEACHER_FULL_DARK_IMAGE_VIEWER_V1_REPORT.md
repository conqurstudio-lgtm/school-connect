# Parent Teacher Full Dark Image Viewer v1

## Applied changes

- Parent ClassLifePostCard images now open in a full dark screen viewer
- TeacherClassPostCard images now open in a full dark screen viewer

## Behaviour

- Parent Class Life images open on click.
- Teacher class post images open on click.
- Viewer covers the whole screen, including top and bottom safe areas.
- Viewer uses a dark phone-screen background.
- Only the image and a small close button are visible.
- The image keeps its real aspect ratio with `objectFit: contain`.
- Existing image layouts remain unchanged before opening.

## Scope lock

- No message composer changes.
- No message scrolling changes.
- No safe-area CSS changes.
- No API route changes.
- No database/schema changes.

## Files changed

- src/components/feed/TeacherProfileClient.tsx
- src/components/teacher/TeacherSelfProfile.tsx

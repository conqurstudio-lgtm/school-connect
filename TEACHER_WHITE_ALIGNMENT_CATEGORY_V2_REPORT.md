# Teacher White Alignment Category v2

## Applied changes

- Aligned teacher profile photo and text stack; converted TeacherSelfProfile to white/charcoal theme
- Converted shared class-space/category tabs to white/charcoal theme
- Applied white/charcoal pass to TeacherHeader
- Applied white/charcoal pass to TeacherFeedClient
- Reinforced white mobile background variables

## Focus fixes

- Teacher profile image and text are vertically aligned.
- Teacher header uses white background and charcoal text.
- Category/tabs area is converted toward white/charcoal instead of old blue/tinted styling.
- Old tinted helper sections are reduced where found.
- Harsh black is replaced with charcoal/dark grey.
- Children/class link copy stays short.

## Scope

- Teacher account UI/theme only.
- No database/schema changes.
- No feed query/API changes.
- No message composer logic changes.
- No parent claim logic changes.

## Files changed

- src/components/teacher/TeacherSelfProfile.tsx
- src/components/class-space/ClassSpacePrimitives.tsx
- src/components/teacher/TeacherHeader.tsx
- src/components/teacher/TeacherFeedClient.tsx
- src/app/mobile-safe-area.css

# White Premium App Theme v1

## Applied changes

- Updated mobile-safe-area.css with white premium theme variables
- Applied white premium color pass to src/app/auth/login/page.tsx
- Applied white premium color pass to src/app/auth/signup/page.tsx
- Cleaned school profile/classes wording and white theme colors
- Kept Add teacher visible after teachers exist
- Cleaned teacher profile header, class invite wording and children wording
- Applied white premium color pass to src/components/feed/FeedClient.tsx

## Design logic added

- Added `WHITE_PREMIUM_APP_THEME_LOGIC_V1.md` as the working style/product logic guide.
- Main background is white.
- Harsh black is replaced with charcoal/dark grey.
- Tinted old backgrounds are reduced or replaced with white/soft grey.
- Heavy font weights are softened.
- Teacher class invite language is shorter.
- Children section language is shorter and points toward parent claiming.
- Add Teacher stays visible after the first teacher is added.

## Scope

- UI/theme polish only.
- No database/schema changes.
- No API route changes.
- No parent-child claim logic yet.
- No message/composer logic changes.

## Files changed

- src/app/mobile-safe-area.css
- src/app/auth/login/page.tsx
- src/app/auth/signup/page.tsx
- src/components/school/SchoolProfilePage.tsx
- src/components/school/TeachersTab.tsx
- src/components/teacher/TeacherSelfProfile.tsx
- src/components/feed/FeedClient.tsx

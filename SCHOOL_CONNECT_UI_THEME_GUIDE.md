# School Connect UI Theme Guide

## Theme name

Premium Simple Admin Theme

## Product feeling

School Connect should feel like school life, not a dashboard. The UI must stay calm, clean, compact and alive. Every screen should help the user know what to do next without over-explaining.

## Layout rules

- Use a mobile-first app shell with a max-width phone layout, usually around 520px.
- Use the soft off-white page background already used on the school admin page.
- Keep the main content scrollable and avoid nested scroll containers unless absolutely necessary.
- Use breathing space, but keep sections compact so the page does not feel empty.
- Avoid dashboard-like blocks, big stats, or too many separate cards.

## Typography rules

- Avoid very heavy font weights such as 800, 900 and 950 unless there is a very strong reason.
- Prefer 500 to 650 for headings and important labels.
- Headings should feel calm, not loud.
- Secondary text should be smaller, softer and lighter in color.
- Keep line-height comfortable, especially for helper text.

## Card rules

- Cards should use soft rounded corners, light borders, and subtle shadows only where needed.
- For detail information, prefer divider lines instead of many small cards.
- Empty states should follow the Classes “No teachers yet” style:
  - centered content
  - dashed/light border
  - soft icon/avatar square
  - clear heading
  - one short secondary sentence
  - one simple action button
- Avoid placing too many icons inside helper cards. Remove decorative icons when they do not add function.

## Button rules

- Buttons should have consistent height, padding, font size and spacing.
- Primary action buttons can use the dark ink color with white text.
- Secondary buttons should be soft, light and calm.
- Do not overload buttons with icons. Use icons only when they improve clarity.
- Empty-state action buttons should match the “No teachers yet” action size and spacing.

## Dropdown / accordion rules

- Use soft rounded containers with light borders.
- Keep accordion headings short.
- Inside expanded content, use divider rows instead of many mini cards.
- Avoid heavy headings inside dropdowns.

## Copy rules

- Keep wording short and practical.
- Do not explain the whole product in every screen.
- Give one clear action where possible.
- Home should feel like activity/life.
- Profile is for identity.
- Classes is for structure.
- Settings is for account actions.

## Current approved examples

- School profile card: logo on top, name below, tagline below, contacts under a thin divider.
- School details: collapsed content using divider lines, not mini cards.
- Classes empty state: “No teachers yet” card style.
- Home empty state: should match the Classes empty-state style.
- Header: school logo/initials as the home anchor, settings as the customization shortcut.

## Applying this to Parent and Teacher pages

When redesigning Parent or Teacher screens, do not rewrite working flows. Apply the theme only to visual structure first:

- reduce heavy font weights
- soften cards and borders
- keep buttons consistent
- simplify empty states
- reduce explanation
- preserve working safe-area behavior
- preserve message composer and scroll logic
- preserve APIs and data flow

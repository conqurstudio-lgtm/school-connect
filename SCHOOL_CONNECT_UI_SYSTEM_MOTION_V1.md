# School Connect UI System + Motion v1

## Purpose

This is the first shared UI foundation for School Connect. It is intentionally small and safe. It does not redesign pages by itself; it gives us one clean system to apply page-by-page.

## Product feeling

School Connect should feel white, calm, premium and focused on school life. The app should not fight with school logos, photos or identities.

## Core tokens

- White background: `#FFFFFF`
- Charcoal text: `#262626`
- Secondary text: `#5F6268`
- Muted text: `#9A9CA3`
- Soft surface: `#F8F8F9`
- Border: `rgba(0,0,0,0.06)`
- Primary action: `#2B2B2F`

## Motion rules

- Use soft fade/slide on page sections.
- Use shimmer for loading lists and cards.
- Use tiny button press feedback only where it feels natural.
- Avoid playful animations, bouncing, or movement that distracts from school content.
- Respect reduced motion settings.

## Minimalist rules

- One screen, one purpose.
- One clear primary action where possible.
- Short headings, shorter helper text.
- Use white space before divider lines.
- Do not introduce new feed layouts without approval.
- Apply the system slowly: auth first, then school shell, teacher shell, parent shell, reports, messages and notifications.

## Classes added

- `.sc-page-enter`
- `.sc-fade-in`
- `.sc-slide-up`
- `.sc-pressable`
- `.sc-soft-card`
- `.sc-soft-surface`
- `.sc-empty-state`, `.sc-empty-icon`, `.sc-empty-title`, `.sc-empty-text`
- `.sc-primary-button`, `.sc-secondary-button`
- `.sc-pill-tabs`, `.sc-pill-tab`
- `.sc-skeleton`

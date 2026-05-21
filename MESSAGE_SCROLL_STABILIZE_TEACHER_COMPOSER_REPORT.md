# Message Scroll Stabilize + Teacher Composer Dock v1

## What was fixed

- Parent: replaced scrollToLatestMessage with stable version
- Parent: media-load auto-scroll now waits until first landing is done
- Parent: composer resize auto-scroll now waits until first landing is done
- Parent: first landing completion flag added
- Teacher: child/parent thread context already exists
- Teacher: replaced repeated scrollIntoView/timeouts with one scroll owner
- Teacher: removed scroll-before-render from load
- Teacher: post-render landing effect not found or already updated
- Teacher: parent-style thread header already exists
- Teacher: composer dock placed inside safe-area dock: True
- Teacher: composer shell matched parent-approved shell: True
- Teacher: composer buttons/icons normalised: False
- Teacher: large fake scroll reserve not found or already removed
- CSS: added teacher composer visibility/safe-area reinforcement

## Scope

- Parent: scroll timing only. Approved Parent composer/banner was not redesigned.
- Teacher: ParentThreadSheet scroll timing and composer dock visibility/placement.
- No API/database/route changes.

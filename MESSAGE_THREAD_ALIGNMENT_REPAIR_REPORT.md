# Message Thread Alignment Repair v1

## Findings from current code

- Parent `scrollToLatestMessage` was disabled, so message scrolling could not reliably land at the latest message.
- Parent composer attach button was still 27px while the shell expected larger controls.
- Parent message intro was rendered between tabs and the scroll area, which can visually compete with the tab/category area.
- Teacher `ParentThreadSheet` composer exists, but it needed stronger bottom/safe-area and z-index positioning.
- Parent and Teacher composer shell/button alignment needed direct source + CSS reinforcement.

## Applied changes

- Parent scrollToLatestMessage restored: True
- Parent MessageThreadPersonHeader inserted: True
- Parent MessageSpaceIntro replaced with person header: True
- Parent composer aligned: True
- Teacher thread sheet/composer repaired: True
- CSS alignment layer added: True

## Scope

- Message thread layout only.
- No API changes.
- No database changes.
- No class post or broadcast changes.

# Teacher Composer Fixed Visible Dock v4

## Why

The Teacher composer exists in `ParentThreadSheet`, but rendering it as a bottom flex/sticky/relative child can still place it below the visible viewport on some phone layouts. This patch brings it up by making the composer a fixed visible dock with the same 520px max-width and safe-area measurements as the Parent composer.

## Applied changes

- Teacher: thread scroll area now reserves space for fixed composer
- Teacher: composer dock changed to fixed visible safe-area dock (True)
- Teacher: composer shell uses approved parent measurements (True)
- Teacher: composer controls match parent measurements (False)
- CSS: added fixed visible teacher composer dock layer

## Untouched

- Parent Messages
- APIs
- database/schema
- teacher broadcast
- teacher class composer

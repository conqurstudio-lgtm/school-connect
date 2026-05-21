# Teacher Composer Visible Dock v3

## Finding

The Teacher composer exists in the code, but it can disappear visually because the dock is competing with the fixed full-height thread layout. This patch does not recreate the composer; it forces the existing composer to be a normal visible bottom flex child.

## Applied changes

- Teacher: thread scroll area made a clean flex child
- Teacher: composer dock forced visible at bottom (True)
- Teacher: composer shell matched approved Parent shell (True)
- Teacher: composer buttons/icons/text area normalised (False)
- CSS: added teacher visible composer dock layer

## Untouched

- Parent Messages
- APIs
- database/schema
- teacher broadcast
- teacher class composer

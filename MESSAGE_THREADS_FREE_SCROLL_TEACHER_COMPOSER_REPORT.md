# Message Threads Free Scroll + Teacher Composer v2

## Goal

Treat message threads like a feed that opens at the latest message once. After that, user scrolling is free.

## Applied changes

- Parent: scrollToLatestMessage changed to one-time bottom landing
- Parent: removed media-load auto-scroll effect (True)
- Parent: removed composer-resize auto-scroll effect (True)
- Teacher: forceScrollToBottom changed to one-time bottom landing
- Teacher: scroll-before-render pattern not found/already removed
- Teacher: changed post-render scroll effect to initial landing only (False)
- Teacher: added user-scroll freedom flags to thread scroller
- Teacher: composer dock forced to parent-approved safe-area dock (True)
- Teacher: composer shell forced to parent-approved shell (True)
- Teacher: composer inner controls normalised (False)
- Teacher: large fake reserve already removed/not found
- CSS: added free-scroll/composer dock reinforcement

## Untouched

- Approved Parent composer/banner design
- APIs
- database/schema
- teacher broadcast
- teacher class composer

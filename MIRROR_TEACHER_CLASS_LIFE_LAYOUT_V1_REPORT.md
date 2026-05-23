# Mirror Teacher Class Life Layout v1

## Applied changes

- Repaired the shared class life post component so it mirrors the teacher post structure instead of introducing a new bordered design.
- Removed post card borders from teacher and parent class life posts.
- Removed divider-style separation from the post layout.
- Teacher and parent now share the same class post visual structure.
- Parent-only reactions remain available without changing the post layout.
- Teacher delete action remains available.

## Design rule locked

Teacher Class Life post layout is the source of truth. Parent Class Life must use the same post layout, not a separate parent design.

## Scope

- Shared class life post component only.
- No API changes.
- No database/schema changes.
- No message/composer changes.

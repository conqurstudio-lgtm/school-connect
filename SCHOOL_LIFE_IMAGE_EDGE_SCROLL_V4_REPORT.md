# School Life Image Edge Scroll v4

## Applied changes

- Rebuilt ActivityCard with edge-scroll media behaviour
- Teacher context enrichment already exists

## Behaviour

- Images still start aligned exactly where they did before, inside the post text column.
- When the admin swipes/slides the multiple-image row, the image row can travel left to the page edge.
- The first image is not visually broken on load because left padding cancels the negative margin.
- Image sizing is adjusted with `calc()` so the cards stay close to the previous size even though the scroll area is wider.
- Single images are unchanged.

## Scope

- School admin feed images only.
- No Parent/Teacher message changes.
- No API route changes.
- No database/schema changes.

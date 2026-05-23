# Parent Class Life Reactions v1

## Applied changes

- Added Love, Like and Celebrate reaction buttons to Parent Class Life posts.
- Uses `post.my_reaction`, `post.reaction_counts` and `post.reaction_count` from the existing profile API.
- Saves to the existing `reactions` table using the logged-in Supabase user.
- Counts update immediately with optimistic UI and rollback if save fails.
- Existing image viewer behaviour remains.

## Scope

- Parent Class Life posts only.
- No Teacher reaction buttons yet.
- No database/schema changes.
- No message/composer changes.

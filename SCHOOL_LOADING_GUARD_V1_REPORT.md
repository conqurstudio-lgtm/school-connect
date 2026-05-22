# School Loading Guard v1

## Problem

The `/school` page could stay on the loading spinner because the previous loader used a chained async call without a catch/finally error state. If Supabase profile/school loading failed or returned an unexpected response, the UI could remain stuck.

## Fix

- Replaced the loader with a guarded async function.
- Uses `maybeSingle()` instead of `single()` to avoid hard failures when rows are missing.
- Adds `try/catch/finally`.
- Always exits loading state.
- Shows a clear error card instead of endless loading.
- Redirects school users without a school to `/auth/school-setup`.
- Redirects non-school users without a school to `/feed`.

## Files changed

- `src/components/school/SchoolPageClient.tsx`

# School Logo Static Blue Setup Dot v10

## Applied changes

- Removed school logo glow keyframes (True)
- Removed animated glow from school logo button
- Removed profile-completion red-dot rule
- Added teacher count state
- Added setup cue rule: only show dot when no posts and no teachers
- Added teacher count query to hide cue after a teacher is added
- Settings dot now uses setupCueActive instead of profileNeedsAttention
- Changed settings cue dot from red to blue
- Removed animation from settings cue dot

## Behaviour

- School logo home button keeps its simple active styling but no longer animates.
- Settings/customize icon shows a small blue dot only while the school has no activity posts and no teachers.
- The blue dot disappears after any published activity exists or after a teacher is added.
- The Home empty state remains simple with the Add teachers button.

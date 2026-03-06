# Riff-Diff — Future Feature Ideas

## High priority

- **Manual bar width adjustment**: Add +/- buttons to increase/decrease the auto-calculated uniform bar width in 10px increments. Default remains the auto-calculated max bar width.
- **Persist filter state**: Save diff filter toggle states to localStorage so they survive page reloads (like zoom/theme/notation already do).

## Medium priority

- **Effects/articulation diff**: Detect changes in bends, slides, hammer-ons, pull-offs, palm mutes, harmonics, vibrato, etc. Currently only notes (fret+string) and tempo/time signature are compared.
- **Collapsible diff summary panel**: Sidebar or bottom panel showing a human-readable list of all differences (e.g. "Measure 5: note changed from B4 to C5", "Measure 12: tempo 120 → 140 BPM"). Include metadata comparison (title, artist, album differences between files). Clickable entries to navigate to the change.

## Low priority

- **Drum tab notation**: alphaTab hides the tab renderer on percussion tracks (`hideOnPercussionTrack = true`) and clears tuning data in `Staff.finish()`. Showing drum tabs alongside standard percussion notation would require either alphaTab upstream support or significant internal workarounds. Standard percussion notation is sufficient for diffing.

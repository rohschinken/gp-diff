# Riff-Diff — Future Feature Ideas

## Nice-to-have

- **Drum tab notation**: alphaTab hides the tab renderer on percussion tracks (`hideOnPercussionTrack = true`) and clears tuning data in `Staff.finish()`. Showing drum tabs alongside standard percussion notation would require either alphaTab upstream support or significant internal workarounds (fake tuning data, factory override, custom percussion-to-fret mapping). Low priority — standard percussion notation is sufficient for diffing.

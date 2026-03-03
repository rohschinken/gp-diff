# Riff-Diff — Claude Code Plan Mode

## Mission
Build **Riff-Diff**: a cross-platform visual diff tool for Guitar Pro 7/8 (`.gp`) files.
Stack: **React + TypeScript + Vite + Tauri + alphaTab + Tailwind + Vitest**.
Each phase follows strict **test-first execution**: write failing tests → implement → tests pass → phase complete.

---

## Subagents

You will operate as a team of specialist subagents. Invoke each by name when their concern is active. Every phase requires sign-off from the relevant agents before proceeding.

### 🏗️ Lead Engineer
Owns architecture and code quality. Makes all structural decisions. Enforces: no JSZip (alphaTab parses GP natively), no custom SVG renderer, overlay must be `position:absolute` inside the alphaTab scroll container, `DiffFilters` flows as props to both `DiffOverlay` and `DiffMinimap`. Breaks implementation into the smallest working increment possible. Maintains a readme.md file and keeps it up to date (but keeps it on point and does not blow it up unecessarily).

### 🧪 QA Engineer
Writes **all tests before implementation begins** in each phase. Uses Vitest. Defines acceptance criteria as runnable assertions. A phase is not complete until `npx vitest run` exits 0. Comes up with new tests that make sense in the context of the app. Also responsible for edge-case coverage: empty measures, mismatched track counts, identical files, single-note changes.

### 🎨 UX Engineer
Owns visual design and interaction. Dark theme by default. Enforces: consistent colour palette (added=#1a7a2e, removed=#7a1a1a, changed=#7a5a1a, tempo/timesig=#b85c00), accessible contrast ratios, keyboard-navigable controls, meaningful empty/loading/error states. Reviews every UI component before it ships.

### 🎸 Musician (Domain Expert)
Validates that the app makes sense to a guitarist. Checks: tab renders with correct string/fret layout (string 1 = high e = top line), measure numbers are visible, tempo and time-sig changes are surfaced clearly, diff colours are intuitive. Raises issues if any musical concept is misrepresented in the UI.

### 📦 Product Owner
Enforces scope. Blocks anything outside the spec. Approves the deliverable of each phase before the next begins. Immediately flags: < GP7 support (out of scope), audio playback (out of scope). 
Potpones for later: midi playback (out of scope for now), standard notation (out of scope for now, we focus on tabs for now)

---

## Critical Technical Constraints
> All agents must respect these.

- `api.loadSong(arrayBuffer)` — alphaTab parses GP internally. Never use JSZip.
- Worker must be copied: `cp node_modules/@coderline/alphatab/dist/alphaTab.worker.* public/` and referenced via `settings.core.scriptFile = '/alphaTab.worker.js'`.
- Player disabled: `settings.player.enablePlayer = false; settings.player.enableCursor = false`.
- Layout: `settings.display.layoutMode = LayoutMode.Horizontal; settings.display.staveProfile = StaveProfile.TabOnly`.
- Overlay scroll: `DiffOverlay` wrapper = `position:absolute; top:0; left:0; pointer-events:none; z-index:10` **inside** `.at-viewport`.
- Zoom re-render: `renderFinished` fires again after `api.updateSettings() + api.render()` — `DiffOverlay` must recompute `BoundsLookup` inside that handler.
- Tempo/time-sig data lives on `score.masterBars[i]`, not on `Beat`.
- Tauri v2 detection: `Boolean((window as any).__TAURI_INTERNALS__)`.
- Minimap uses `ResizeObserver` — never hardcode canvas width.
- File filters: `.gp, .gp7, .gp8` only. GP5 & GP6 excluded.

---

## Data Model Reference

```
Score.masterBars[]: MasterBar       ← tempo, timeSignatureNumerator/Denominator
Score.tracks[]: Track
  └── staves[0].bars[]: Bar         ← one per measure
        └── voices[0].beats[]: Beat
              ├── duration: Duration
              └── notes[]: Note
                    ├── string: number
                    ├── fret: number
                    └── isTieDestination: boolean
```

```typescript
// BoundsLookup (available after renderFinished)
api.renderer.boundsLookup.findBeat(beat)          // → { realBounds: {x,y,width,height} }
api.renderer.boundsLookup.masterBarBounds[index]  // → MasterBarBounds
```

---

## Diff Types (define in `src/diff/types.ts` in Phase 4)

```typescript
export type BeatStatus = 'equal' | 'added' | 'removed' | 'changed';
export interface DiffFilters { showAdded: boolean; showRemoved: boolean; showChanged: boolean; showTempoTimeSig: boolean; }
export interface NoteDiff { note: Note; status: 'noteAdded' | 'noteRemoved' | 'noteEqual'; }
export interface BeatDiff { beatA: Beat|null; beatB: Beat|null; status: BeatStatus; noteDiffs?: NoteDiff[]; }
export interface MeasureDiff {
  measureIndex: number;
  beatDiffs: BeatDiff[];
  tempoDiff: { tempoA: number; tempoB: number } | null;
  timeSigDiff: { sigA: string; sigB: string } | null;
}
export interface DiffResult {
  measures: MeasureDiff[];
  summary: { equal: number; added: number; removed: number; changed: number; tempoChanges: number; timeSigChanges: number; totalMeasures: number; };
}
```

---

## File Structure

```
riff-diff/
├── src/
│   ├── diff/           diffEngine.ts · types.ts · diffEngine.test.ts
│   ├── renderer/       AlphaTabPane.tsx · DiffOverlay.tsx
│   ├── hooks/          useFileLoader.ts · useSyncScroll.ts
│   ├── components/     SplitPane · TrackToolbar · DiffMinimap · DiffFilterBar · DiffSummaryBar · DiffLegend · DropZone
│   ├── App.tsx
│   └── main.tsx
├── public/             alphaTab.worker.js (copied from node_modules)
└── src-tauri/
```

---

## Phases

Each phase: **QA Engineer writes tests first → Lead Engineer implements → tests pass → UX/Musician/PO sign off → next phase.**

---

### Phase 1 — Scaffold & Tooling
**Agents:** Lead Engineer, QA Engineer

**Setup:**
```bash
npm create tauri-app@latest riff-diff -- --template react-ts
npm install @coderline/alphatab
npm install -D tailwindcss postcss autoprefixer vitest @vitest/ui
cp node_modules/@coderline/alphatab/dist/alphaTab.worker.* public/
```

**vite.config.ts:** exclude `@coderline/alphatab` from optimizeDeps; add COOP/COEP headers.

**Implement:** `useFileLoader` hook (web: `<input type="file">` → ArrayBuffer; Tauri: plugin-dialog + plugin-fs). Basic `<SplitPane>` with two columns, bright Tailwind theme.

**Tests (`src/hooks/useFileLoader.test.ts`):**
- Mock `File` → hook returns `{ fileName, buffer: ArrayBuffer }`
- Invalid file type is rejected
- Web and Tauri paths both return same shape

**Phase gate:** `npx vitest run` passes. App renders two empty panes. PO confirms no out-of-scope items added.

---

### Phase 2 — alphaTab Rendering (Single Pane)
**Agents:** Lead Engineer, QA Engineer, Musician

**Implement:** `AlphaTabPane.tsx` — mounts alphaTab API on a `ref`, loads `buffer` via `api.loadSong()`, fires `onRenderFinished(api)`, calls `api.destroy()` on unmount. Settings: Horizontal (endless, do not break into lines), TabOnly, player disabled (might add an option to enable later).

**Tests (`src/renderer/AlphaTabPane.test.ts`):**
- Mock `AlphaTabApi`; assert `loadSong` called with correct buffer
- Assert `destroy()` called on unmount
- Assert `renderFinished` callback invoked after load
- Assert worker scriptFile set to `/alphaTab.worker.js`

**Phase gate:** Tests pass. Musician confirms a real `.gp` file renders as readable horizontal tab with visible string lines, fret numbers, and measure bars.

---

### Phase 3 — Dual Pane & Track Switcher
**Agents:** Lead Engineer, QA Engineer, UX Engineer, Musician

**Implement:** Two `<AlphaTabPane>` instances in `App.tsx`. State: `bufferA/B`, `apiA/B`, `scoreA/B`, `trackMapA/B`. `<TrackToolbar>` with track name tabs and two manual-mapping `<select>` dropdowns. Show warning badge when track counts differ. On track change: `api.renderTracks([score.tracks[trackMap]])`.

**Tests (`src/components/TrackToolbar.test.ts`):**
- Renders track names from `scoreA`
- Clicking track N calls `onTrackChange(N)`
- Warning badge renders when `scoreA.tracks.length !== scoreB.tracks.length`
- Manual dropdowns call `onTrackMapChange` with correct side and index

**Phase gate:** Tests pass. Musician confirms switching tracks re-renders correct instrument in both panes.

---

### Phase 4 — Diff Engine
**Agents:** QA Engineer (leads), Lead Engineer

**Tests first (`src/diff/diffEngine.test.ts`) — write all tests before any implementation:**
- Identical scores → all beats `equal`, zero changes in summary
- Score B has extra measure → measure marked `added`
- Score A has extra measure → measure marked `removed`
- Same measure, one note fret changed → beat `changed`, note-level diff correct
- Tempo differs on measure 3 → `tempoDiff` populated, `timeSigDiff` null
- Time sig differs on measure 2 → `timeSigDiff` populated
- Empty measure (no beats) handled without crash
- Summary counts match actual measure diffs

**Implement:** `diffScores(scoreA, scoreB, trackIndexA, trackIndexB): DiffResult`
- Align `masterBars` by index; extras = added/removed
- Per measure: check `tempo` and `timeSignatureNumerator/Denominator` for diffs
- Extract beats from `tracks[idx].staves[0].bars[i].voices[0].beats`
- LCS on beat signatures: `beatSignature = (beat) => \`${beat.duration}|${beat.notes.map(n=>\`${n.string}:\${n.fret}\`).sort().join(',')}\``
- Note-level diff for `changed` beats

**Phase gate:** All tests pass. Lead Engineer reviews LCS logic. PO confirms scope (no rhythm-only diff unless notes differ).

---

### Phase 5 — Diff Overlay
**Agents:** Lead Engineer, QA Engineer, UX Engineer, Musician

**Implement:** `DiffOverlay.tsx` — after `renderFinished`, iterate `DiffResult`. For each `BeatDiff`: call `boundsLookup.findBeat(beat)` → render coloured `<div>` at `realBounds`. Null beats → ghost overlay using `masterBarBounds`. Tempo/timeSig diffs → amber badge at top of measure. Respects `DiffFilters` prop.

**Tests (`src/renderer/DiffOverlay.test.ts`):**
- `added` beat renders overlay with bg `#1a7a2e`
- `removed` beat renders overlay with bg `#7a1a1a`
- `changed` beat renders overlay with bg `#7a5a1a`
- `equal` beat renders no overlay div
- When `filters.showAdded = false`, added overlays not rendered
- Tempo diff renders amber badge; hidden when `filters.showTempoTimeSig = false`
- Recomputes on second `renderFinished` call (resize/zoom simulation)

**Phase gate:** Tests pass. Musician loads two similar `.gp` files with one note changed; confirms only that beat is highlighted. UX confirms colours meet contrast standard.

---

### Phase 6 — Synchronized Scrolling
**Agents:** Lead Engineer, QA Engineer, UX Engineer

**Implement:** `useSyncScroll(refA, refB)` — attach `scroll` listeners to both `.at-viewport` elements; mirror `scrollLeft` with a `locked` flag + `requestAnimationFrame` guard to prevent loops. Expose `.at-viewport` from each pane via `useImperativeHandle`.

**Tests (`src/hooks/useSyncScroll.test.ts`):**
- Scrolling element A sets `scrollLeft` on B to the same value
- Scrolling element B sets `scrollLeft` on A
- Rapid scroll events don't cause infinite loop (fire > 10 events, assert listener called ≤ expected times)
- Cleanup: event listeners removed on unmount

**Phase gate:** Tests pass. UX confirms dragging either scrollbar moves both panes. Overlays scroll correctly with score.

---

### Phase 7 — Diff Minimap
**Agents:** Lead Engineer, QA Engineer, UX Engineer

**Implement:** `DiffMinimap.tsx` — full-width `<canvas>` (28px tall). Draw one stripe per measure coloured by worst diff status. Draw viewport indicator rect. Clickable/draggable to seek both panes. `ResizeObserver` redraws on resize. Respects `DiffFilters`.

**Tests (`src/components/DiffMinimap.test.ts`):**
- Canvas drawn with correct number of stripes = `totalMeasures`
- Measure with `removed` beat → stripe colour is red-family
- Measure with `equal` only → stripe colour is grey-family
- Filtered-out status → stripe falls back to grey
- Click at 50% canvas width → `onSeek(~0.5)` called
- `ResizeObserver` callback triggers redraw

**Phase gate:** Tests pass. UX confirms minimap reflects diff distribution and clicking seeks both panes correctly.

---

### Phase 8 — Diff Filter Toggles
**Agents:** Lead Engineer, QA Engineer, UX Engineer

**Implement:** `DiffFilterBar.tsx` — four toggle buttons (Added/Removed/Changed/Tempo+TimeSig) showing live counts from `diffResult.summary`. `DiffFilters` state in `App.tsx`, passed down to `DiffOverlay` (×2) and `DiffMinimap`.

**Tests (`src/components/DiffFilterBar.test.ts`):**
- All four buttons render with correct counts
- Clicking Added button toggles `filters.showAdded`
- Active/inactive visual state applied correctly
- Count updates when `diffResult.summary` changes

**Phase gate:** Tests pass. Musician confirms toggling "Removed" hides red overlays in both panes and minimap simultaneously.

---

### Phase 9 — UI Shell & Polish
**Agents:** UX Engineer (leads), Musician, Product Owner

**Implement:**
- Header: logo, file-load buttons, zoom `+`/`−`, file names
- Drag-and-drop on each pane's `DropZone`
- Spinner overlay during alphaTab render
- Error card if `api.loadSong` throws
- Keyboard shortcuts: `←`/`→` scroll 200px; `1`–`9` switch track; `[`/`]` jump to prev/next diff; `A`/`R`/`C`/`T` toggle filters
- Jump to next/prev diff buttons using `masterBarBounds.realBounds.x`
- Zoom calls `api.updateSettings() + api.render()` on both panes

**Tests (`src/components/DropZone.test.ts`, `src/App.test.ts`):**
- Drop event with valid `.gp` file calls `onFileLoaded`
- Drop event with invalid extension shows error
- Keyboard shortcut `[` calls scroll-to-prev-diff with correct bar index
- Zoom in increments `settings.display.scale` by 0.1

**Phase gate:** PO confirms all features in spec are present. Musician does full walkthrough with a real pair of `.gp` files. UX signs off on visual consistency.

---

### Phase 10 — Tauri Desktop Packaging
**Agents:** Lead Engineer, QA Engineer

**Configure** `tauri.conf.json`: identifier `com.yourname.riffdiff`, targets `["msi","dmg","app"]`, window `1440×900` min `960×600`, title `Riff-Diff`. Add `tauri-plugin-dialog` and `tauri-plugin-fs` to `Cargo.toml`.

**Verify** `useFileLoader` Tauri path works end-to-end (file dialog → `readFile` → `ArrayBuffer`).

**Build:**
```bash
npm run build                                            # static web
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows .msi
npm run tauri build                                      # Mac .dmg/.app
```

**Tests:**
- `useFileLoader` Tauri branch: mock `__TAURI_INTERNALS__`, assert `plugin-dialog` `open()` called with correct extensions, assert buffer returned

**Phase gate:** Web build loads and runs in browser. Desktop installer produces working app on target OS.

---

## Agent Sign-off Matrix

| Phase | Lead Eng | QA | UX | Musician | PO |
|---|---|---|---|---|---|
| 1 Scaffold | ✅ req | ✅ req | — | — | ✅ req |
| 2 alphaTab | ✅ req | ✅ req | — | ✅ req | — |
| 3 Dual Pane | ✅ req | ✅ req | ✅ req | ✅ req | — |
| 4 Diff Engine | ✅ req | ✅ leads | — | — | ✅ req |
| 5 Overlay | ✅ req | ✅ req | ✅ req | ✅ req | — |
| 6 Scroll Sync | ✅ req | ✅ req | ✅ req | — | — |
| 7 Minimap | ✅ req | ✅ req | ✅ req | — | — |
| 8 Filters | ✅ req | ✅ req | ✅ req | ✅ req | — |
| 9 Polish | ✅ req | ✅ req | ✅ leads | ✅ req | ✅ req |
| 10 Tauri | ✅ req | ✅ req | — | — | ✅ req |

---

## Out of Scope — Block Immediately
- GP5, GP6 file support
- Audio or MIDI playback
- Server-side processing of any kind
- JSZip (alphaTab handles parsing)

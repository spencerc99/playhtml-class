# Week 0 Guestbook + Site Profile — Design

Date: 2026-06-16

## Goal

Add a guestbook to the bottom of week 0 where visitors leave a freeform message,
and a site-wide profile control (name + cursor color) that persists and drives
their playhtml cursor identity. The name + color saved per visitor will be reused
later when they submit class work.

## Key insight

playhtml already has a native player identity: `PlayerIdentity` (`name`,
`playerStyle.colorPalette`), persisted to `localStorage` under
`playhtml_player_identity`, fed into cursors. The browser extension reads/writes
the same key. So name + cursor color ARE the playhtml identity — we drive it
through the existing API rather than inventing our own store. Works with or
without the extension (localStorage handles persistence natively; the extension
just additionally syncs the same key).

## API (installed @playhtml/react@0.10.0)

- Read (reactive): `usePlayContext()` → `cursors.color`, `cursors.name`,
  `hasSynced`, `isProviderMissing`, `getMyPlayerIdentity()`.
- Write: `configureCursors({ playerIdentity })` — persists to localStorage,
  updates the live cursor, broadcasts. Must pass a full VALID identity (keep
  `publicKey`; `assertValidPlayerIdentity` runs internally and throws otherwise).
- Default when identity is null: `generatePersistentPlayerIdentity()` from
  `@playhtml/react`'s re-exported common, or read current then fall back.
- Cursors are already enabled in `src/index.tsx` initOptions, so `cursorClient`
  exists.

Note: `usePlayerIdentity()` exists in newer playhtml but NOT in 0.10.0 — do not
use it.

## Components

### ProfileEditor (`src/components/ProfileEditor.tsx`)

Shared name + color editor used in both the nav popover and the inline guestbook
prompt. Single source of truth.

- Reads current name/color via `usePlayContext()` (`cursors.color`/`cursors.name`).
- Name: text input. Color: `<input type="color">`.
- On change: builds a full identity from `getMyPlayerIdentity()` (or
  `generatePersistentPlayerIdentity()` if null), replaces `name` /
  `playerStyle.colorPalette[0]`, calls `configureCursors({ playerIdentity })`.
- Defensive: if `isProviderMissing`, render nothing (inert). Never throws.

### ProfilePill (`src/components/ProfilePill.tsx`)

Profile control appended to the existing bottom `Nav`.

- A pill matching the nav's red/white style. Label = the visitor's name (shown in
  their color) once set, else a "set up profile" prompt.
- Click toggles a popover that opens UPWARD from the pill, containing
  `<ProfileEditor />`. Click-away / Escape closes.

### Guestbook (`src/components/Guestbook.tsx`)

Inline at the bottom of week 0.

- Entries via `withSharedState({ defaultData: { entries: [] }, id:
'week0-guestbook' })`, mirroring playhtml's canonical DocsGuestbook.
- Gating: if no name set (`!cursors.name?.trim()`), render `<ProfileEditor />`
  with a "set your name to sign the guestbook" message — NO post form. Once a name
  exists, show the post form (freeform `<textarea>` + Sign button).
- Entry shape: `{ id, name, color, text, at }` — snapshot name+color at post time
  (this is the data to mine later). `at` = `Date.now()`.
- Submit: trim; empty no-ops and clears. Mutator-form
  `setData((d) => d.entries.push(entry))`.
- Render newest-first: name (in their color) · relative timestamp · message.
- Relative time helper: "just now" / "Nm ago" / "Nh ago" / "yesterday" / locale
  date, threaded with a single 30s interval tick (per canonical pattern).

## Files changed

- New: `src/components/ProfileEditor.tsx`
- New: `src/components/ProfilePill.tsx`
- New: `src/components/Guestbook.tsx`
- Edit: `src/Nav.tsx` — render `<ProfilePill />` in the bar
- Edit: `src/content/weeks/week-0.mdx` — replace the broken
  `<div id="guestbook">` + script stub with `<Guestbook />`
- Edit: `src/App.scss` — pill, popover, guestbook, profile editor styles

## Edge cases

- Identity not synced yet: `cursors.color`/`cursors.name` may be empty; editor
  still interactive, writes apply once identity exists; no crash.
- Empty name: guestbook stays gated (can't post). Profile pill shows prompt.
- Empty/whitespace message: cleared, no-op.
- Color write keeps the rest of `playerStyle` and `publicKey` intact (spread).
- Provider missing: components render inert, never throw.

## Decisions made

- Identity = playhtml PlayerIdentity (not separate). Works without extension.
- Entries shared via playhtml (not local-only).
- Cursor color via free `<input type="color">` (not preset swatches).
- Profile control = a pill in the existing bottom nav, popover opens upward.
- Guestbook gates on name being set; shows inline editor if unset.
- Extra included: relative timestamps. Excluded: profanity filter, entry cap,
  live cursor preview (can revisit).

## Out of scope

- Editing/deleting existing entries.
- Per-week guestbooks (week 0 only for now).
- Reusing the saved identity in submission flows (future work; the data shape is
  ready for it).

# Showcase and playground data ownership

Date: 2026-07-20

## Decision

The class project system has two distinct kinds of persistent PlayHTML data, and each has one canonical route:

- `/showcase#student-projects` owns the project registry. Submission forms on week pages and the full-screen playground consume this registry through `data-source`.
- `/playground#<project-shared-id>` owns each individual project's interactive object state. The showcase consumes these objects through `data-source` instead of declaring duplicate `shared` elements.

The registry remains on `/showcase` because that is the live persisted room containing current submissions. Moving it would require an explicit data migration and would risk splitting or losing existing project records.

## Why the object source belongs on `/playground`

Connection snippets already point participant sites at `class.playhtml.fun/playground#<project-shared-id>`. Making `/playground` authoritative aligns the public connection code, the full-screen experience, and cross-site state under one source.

Previously, both `/showcase` and `/playground` declared every project object with `shared="read-write"`. Identical element IDs on different paths create separate persisted states, so toggling the showcase object did not update the playground object. The showcase now mounts a writable `data-source` consumer pointing to the playground source. Existing playground object state wins; the duplicate showcase state is no longer used.

## Project appearance edits

The project details form stores metadata such as description, fallback emoji, glow color, and ring icon URL in the registry. Starter thumbnails also embed generated HTML and CSS. Editing metadata must update both layers or the form appears to save while the visible thumbnail remains unchanged.

For starter thumbnails, detail edits now update only the generated appearance pieces:

- fallback emoji text;
- favicon and explicit ring-image elements;
- accessible title;
- occurrences of the previous glow color in the starter CSS.

Custom HTML that no longer contains `.starter-project-appearance` is left untouched. This preserves code-editor customization while allowing the details form to keep standard thumbnails synchronized with their metadata.

## Invariants

- Never mount the same project object as a `shared` source on more than one route.
- Registry writes continue through `student-projects`, regardless of which form route initiated them.
- Project connection snippets continue to use `/playground#<project-shared-id>`.
- Optional metadata must remain valid without being required for submission.

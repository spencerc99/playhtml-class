# Showcase and playground data ownership

Date: 2026-07-20

## Decision

The class project system has two kinds of persistent PlayHTML data with one canonical route:

- `/showcase#student-projects` owns the project registry. Submission forms on week pages and the full-screen playground consume this registry through `data-source`.
- `/showcase#<project-shared-id>` owns each individual project's interactive object state. The full-screen playground and participant sites consume these objects through `data-source`.

The Showcase is the single source of truth for both which projects exist and how their objects are currently behaving. The registry remains there because it is the live persisted room containing current submissions. Moving it would require an explicit data migration and would risk splitting or losing existing project records.

## Route responsibilities

`/showcase` publishes the registry and project objects. `/playground` consumes both and renders the immersive full-screen webring used by the expanded widget. It remains able to edit project appearance by writing to the Showcase registry, but it does not publish an independent copy of any project object.

Connection snippets point participant sites at `class.playhtml.fun/showcase#<project-shared-id>`. This gives every project one public source URL and makes both compact and full-screen presentations consumers of the same canonical data.

Declaring the same project object with `shared="read-write"` on multiple paths creates separate persisted states. Only the Showcase may publish these objects. The independent object state previously stored under `/playground` is no longer used; this does not affect project records or appearance data stored in the Showcase registry.

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
- Project connection snippets use `/showcase#<project-shared-id>`.
- `/playground` is a presentation and editing surface, including when embedded by the expanded widget; it is not a shared-element source.
- Optional metadata must remain valid without being required for submission.

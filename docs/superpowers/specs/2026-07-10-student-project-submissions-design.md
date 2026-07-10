# Student Project Submissions — Design

Date: 2026-07-10

## Goal

Let students submit a project URL from the bottom of a class week page and show
all submissions in the site Showcase. The collection must persist and remain
available across every route on the class domain without changing the existing
page-scoped PlayHTML behavior used by attendance and the guestbook.

## Scope

This implementation includes:

- A reusable React submission form.
- Name, project title, and project URL fields.
- A domain-accessible PlayHTML collection.
- Submission forms on week pages and the Showcase page.
- A responsive Showcase card grid.
- Inline validation and submission feedback.
- Browser verification across separate routes.

Editing, deletion, moderation, thumbnails, cross-site navigation, and custom
interactions between student sites are outside this implementation.

## Architecture

The Showcase owns the canonical shared element at
`/showcase#student-projects`. It is registered as a read-write shared source.
Submission forms on other routes connect to that source through PlayHTML's
`dataSource` support using the current host, the canonical `/showcase`
path, and the `student-projects` element id.

This keeps the existing PlayProvider room page-scoped. Changing the provider to
one domain-wide room would merge unrelated attendance and guestbook data across
routes, so the feature uses a targeted shared source instead.

## Data model

Submissions are stored in a keyed map:

```ts
interface ProjectSubmission {
  id: string;
  name: string;
  submittedBy?: string;
  title: string;
  url: string;
  submittedAt: number;
}

interface ProjectSubmissionData {
  projects: Record<string, ProjectSubmission>;
}
```

Each submit action creates a UUID and writes one map key with PlayHTML's mutator
form. Keyed writes are concurrency-safe and idempotent. The Showcase derives a
newest-first array from the map without storing computed ordering.

## Components

### ProjectSubmissions

A shared-state component supports two modes:

- `source`: renders on the Showcase, registers the canonical shared element,
  and displays both the collection and the form.
- `form`: renders on week pages and connects to the canonical source through
  `dataSource`.

Both modes use the same data shape and submit behavior, avoiding duplicate data
logic.

### Submission form

The form collects:

- Student name, initially populated from the current PlayHTML cursor identity.
- Project title.
- Project URL.

All fields are required. URLs are trimmed, parsed with `URL`, and accepted only
when they use `http:` or `https:`. A successful submission retains the name
while clearing the title and URL for intentional follow-up submissions.
New submissions snapshot the visitor's stable PlayHTML player id in
`submittedBy`. The form uses that id to show a read-only list of the current
visitor's previous submissions after reloads and across class-site routes.
Records created before ownership tracking remain in the Showcase but do not
appear in a visitor's personal list.

### Showcase cards

The Showcase renders responsive cards with the project title, student name,
and external project link. The design follows the existing class
site's oversized uppercase typography, red accent, white panels, playful hover
movement, and generous spacing.

## Error handling

- Missing fields produce concise inline guidance.
- Invalid or non-web URLs are rejected before any shared write.
- Submit controls remain ordinary accessible HTML controls and work by keyboard.
- Submitting waits for a stable PlayHTML player identity so the record can be
  attributed across browser sessions.
- Shared data is never written from an effect or render callback; writes occur
  only from explicit form submissions.
- Empty shared data renders a loading state before PlayHTML sync and an inviting
  empty state afterward.

## Placement

The form appears after each week page's content. The Showcase page contains the
canonical source, the submission form, and the project grid. The component can
later be placed on another route without changing its data model.

## Verification

Per Spencer's direction, this feature will be verified in the real browser
rather than with automated tests. Verification covers:

1. Load a week route and submit a valid project.
2. Navigate to the Showcase and confirm the project card appears.
3. Reload the Showcase and confirm the project persists.
4. Submit invalid and incomplete values and confirm no shared write occurs.
5. Check desktop and narrow viewport layouts.

The existing repository-wide Vitest, ESLint, and Prettier baseline failures are
unrelated to this feature and remain outside this change.

## Future discussion

After this feature is complete, discuss a cross-site widget that can navigate
between student projects and use PlayHTML shared sources, references, events,
and presence to support interactions between them.

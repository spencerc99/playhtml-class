# Student Project Submissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable project submission form whose data is shared across the class domain and displayed as project cards on the Showcase page.

**Architecture:** `/showcase#student-projects` is the canonical read-write PlayHTML shared source. Forms on week routes reference that source with `dataSource`, preserving the existing page-scoped rooms used by attendance and the guestbook.

**Tech Stack:** React 19, TypeScript, `@playhtml/react` 2.0.1, PlayHTML 2.13.1, Vite, Sass, Bun.

## Global Constraints

- Use Bun for project commands.
- Every code file starts with exactly two `ABOUTME` comment lines.
- Keep the existing PlayProvider room page-scoped.
- Store projects in a keyed map and write only from explicit form submission.
- Accept only complete `http:` or `https:` URLs.
- Do not add editing, deletion, moderation, thumbnails, or the cross-site widget.
- Per Spencer's direction, verify in a real browser and do not add automated tests.

---

### Task 1: Shared Submission Component

**Files:**
- Create: `src/components/ProjectSubmissions.tsx`

**Interfaces:**
- Consumes: `withSharedState`, `usePlayContext`, and the current browser host.
- Produces: `ProjectSubmissions({ variant: 'form' | 'showcase' })`.

- [ ] **Step 1: Define the shared data contract and source configuration**

Define `ProjectSubmission`, `ProjectSubmissionData`, and the constant element id
`student-projects`. Configure `withSharedState` from props:

```tsx
interface ProjectSubmissionsProps {
  variant: 'form' | 'showcase';
}

const PROJECTS_ELEMENT_ID = 'student-projects';
const EMPTY_PROJECTS: ProjectSubmissionData = { projects: {} };

const projectSource = () =>
  `${window.location.host}/showcase#${PROJECTS_ELEMENT_ID}`;

export const ProjectSubmissions = withSharedState<
  ProjectSubmissionData,
  never,
  ProjectSubmissionsProps
>(
  (props) => ({
    defaultData: EMPTY_PROJECTS,
    id: PROJECTS_ELEMENT_ID,
    ...(props.variant === 'showcase'
      ? { shared: true }
      : { dataSource: projectSource() }),
  }),
  (playProps, props) => <section />,
);
```

- [ ] **Step 2: Implement local form state and validation**

Use controlled fields for name, title, and URL. Seed the name from
`cursors.name`, then update it locally if identity arrives after mount and the
student has not typed a different name. Validate required fields and normalize
URLs with:

```ts
function normalizeProjectUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Write one keyed submission on submit**

Create a UUID-based id, snapshot all fields, the stable PlayHTML player id, and
`Date.now()`, then perform one mutator write:

```ts
setData((draft) => {
  draft.projects[submission.id] = submission;
});
```

Keep the submitted name, clear title and URL, and announce success
through an `aria-live="polite"` status.

Derive the current visitor's previous submissions by filtering on the stored
player id and render them as a read-only link list beneath the form. Older
records without an owner id remain visible in the Showcase but are not claimed.

- [ ] **Step 4: Render the Showcase list in source mode**

Sort `Object.values(data.projects)` by descending `submittedAt`. Render an empty
state after sync, or a compact row list with title, student, and an external
`http(s)` link using `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 5: Commit the shared component**

```bash
git add src/components/ProjectSubmissions.tsx
git commit -m "Add shared project submissions"
```

### Task 2: Route Placement and Showcase Integration

**Files:**
- Modify: `src/pages/Week.tsx`
- Modify: `src/pages/Showcase.tsx`

**Interfaces:**
- Consumes: `ProjectSubmissions({ variant })` from Task 1.
- Produces: week-page submission forms and the canonical Showcase source.

- [ ] **Step 1: Place the form after week content**

Import `ProjectSubmissions` into `Week.tsx` and render:

```tsx
<ProjectSubmissions variant="form" />
```

after the week article so every week route has the same reusable submission
surface.

- [ ] **Step 2: Replace the Showcase placeholder**

Keep the Showcase heading and introductory copy, then render:

```tsx
<ProjectSubmissions variant="showcase" />
```

as the only canonical `shared` source for `student-projects`.

- [ ] **Step 3: Commit route integration**

```bash
git add src/pages/Week.tsx src/pages/Showcase.tsx
git commit -m "Connect submissions to class pages"
```

### Task 3: Submission and Showcase Styling

**Files:**
- Modify: `src/App.scss`

**Interfaces:**
- Consumes: `project-submissions__*` classes rendered by Task 1.
- Produces: responsive form, feedback, empty state, and card-grid presentation.

- [ ] **Step 1: Add form styles**

Use the site's red accent, white panels, uppercase display font, rounded borders,
and a responsive two-column field grid that collapses to one column below 700px.
Inputs must retain visible focus rings and the submit button must have hover and
focus movement without shifting surrounding layout.

- [ ] **Step 2: Add Showcase card styles**

Use a responsive `repeat(auto-fit, minmax(220px, 1fr))` grid, visible
external-link affordance, and subtle rotation/translation
on hover. Preserve readable contrast in dark mode wherever the current page
supports it.

- [ ] **Step 3: Commit presentation**

```bash
git add src/App.scss
git commit -m "Style project submissions and showcase"
```

### Task 4: Real Browser Verification

**Files:**
- Modify only files from Tasks 1-3 if browser evidence identifies a defect.

**Interfaces:**
- Consumes: the complete feature running through Vite and real PlayHTML.
- Produces: evidence that a submission written on one route appears and persists
  on another route.

- [ ] **Step 1: Start the Bun development server**

Run:

```bash
bun run dev --host 127.0.0.1
```

Expected: Vite serves the isolated worktree without a compile error.

- [ ] **Step 2: Verify validation on a week page**

Open an unlocked `/week/0` route. Submit empty fields and a non-HTTP URL. Confirm
the inline error appears and no Showcase card is created.

- [ ] **Step 3: Verify cross-route persistence**

Submit a uniquely titled project from `/week/0`, navigate to `/showcase`, and
confirm the matching title, name, and normalized URL appear. Reload the
Showcase and confirm the card remains.

- [ ] **Step 4: Verify responsive layout**

Inspect both routes at desktop width and a narrow mobile viewport. Confirm fields
remain usable, the compact list reflows cleanly, the fixed navigation does not
cover controls, and focus states are visible.

- [ ] **Step 5: Commit browser-driven fixes, if any**

Stage only files changed to address observed defects and commit them with a
message that names the corrected behavior.

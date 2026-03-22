// ABOUTME: Per-week class page with examples, live crit zone, and assignment
// ABOUTME: submission area.

import { useParams } from 'react-router';

const WEEK_TITLES: Record<string, string> = {
  '0': 'Welcome Letter',
  '1': 'Step Inside / Introduction to PlayHTML',
  '2': 'Sync — Move, Live Cursors',
  '3': 'Async — Guestbooks, Notes',
  '4': 'Custom Events',
  '5': 'Party!',
};

export default function Week() {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const title = WEEK_TITLES[weekNumber ?? ''] ?? `Week ${weekNumber}`;

  return (
    <div className="min-h-screen px-8 py-12">
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#e00000]">
        Week {weekNumber}
      </p>
      <h1 className="mb-8 text-4xl font-extrabold uppercase text-[#e00000]">
        {title}
      </h1>

      {/* Examples section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">Examples</h2>
        <p className="text-neutral-500 dark:text-neutral-400">
          Examples and demos will be added here during class.
        </p>
      </section>

      {/* Assignment submission */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">Submit Your Assignment</h2>
        <p className="mb-4 text-neutral-500 dark:text-neutral-400">
          Paste your site URL below to submit.
        </p>
        {/* TODO: playhtml-powered submission form */}
      </section>

      {/* Live crit zone */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Live Crit</h2>
        <p className="text-neutral-500 dark:text-neutral-400">
          Submitted projects will appear here for live review.
        </p>
        {/* TODO: iframe viewer for selected student site */}
      </section>
    </div>
  );
}

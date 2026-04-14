// ABOUTME: Per-week class page with examples, live crit zone, and assignment
// ABOUTME: submission area.

import type { ComponentType } from 'react';
import { useParams } from 'react-router';

interface WeekContentMeta {
  title?: string;
}

interface WeekContentModule {
  default: ComponentType;
  meta?: WeekContentMeta;
}

const WEEK_CONTENT = import.meta.glob<WeekContentModule>(
  '../content/weeks/week-*.mdx',
  {
    eager: true,
  },
);

export default function Week() {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const modulePath = weekNumber
    ? `../content/weeks/week-${weekNumber}.mdx`
    : '';
  const weekModule = weekNumber ? WEEK_CONTENT[modulePath] : undefined;
  const title = weekModule?.meta?.title ?? `Week ${weekNumber}`;
  const Content = weekModule?.default;

  return (
    <div className="min-h-screen px-8 py-12">
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#e00000]">
        Week {weekNumber}
      </p>
      <h1 className="mb-8 text-4xl font-extrabold uppercase text-[#e00000]">
        {title}
      </h1>

      {Content ? (
        <article className="week-content">
          <Content />
        </article>
      ) : (
        <section className="max-w-3xl rounded-xl border border-[#e00000]/20 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-3 text-2xl font-bold text-[#e00000]">
            Not Published Yet
          </h2>
          <p className="text-base leading-7 text-neutral-700">
            Add{' '}
            <code className="bg-[#e00000]/8 rounded px-2 py-1 text-sm">
              src/content/weeks/week-{weekNumber}.mdx
            </code>{' '}
            to publish this week&apos;s page.
          </p>
        </section>
      )}
    </div>
  );
}

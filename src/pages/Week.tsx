// ABOUTME: Per-week class page with examples, live crit zone, and assignment
// ABOUTME: submission area.

import type { ComponentType } from 'react';
import { Link, useParams } from 'react-router';

interface WeekContentMeta {
  title?: string;
  kicker?: string;
  summary?: string;
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

interface WeekVisualMeta {
  kicker: string;
  summary: string;
  panelClass: string;
  borderClass: string;
  dotClass: string;
}

const WEEK_VISUALS: Record<number, WeekVisualMeta> = {
  0: {
    kicker: 'Setup + Orientation',
    summary:
      'Get your environment ready and enter class with a working workflow.',
    panelClass: 'from-rose-100/80 via-white/75 to-orange-100/80',
    borderClass: 'border-rose-400/30',
    dotClass: 'bg-rose-500',
  },
  1: {
    kicker: 'Step Inside',
    summary:
      'Define your digital communal space and ship the first live version.',
    panelClass: 'from-red-100/75 via-white/75 to-amber-100/75',
    borderClass: 'border-red-400/30',
    dotClass: 'bg-red-500',
  },
  2: {
    kicker: 'Synchronous Behaviors',
    summary:
      'Make your bench feel alive with movement, presence, and live cursors.',
    panelClass: 'from-cyan-100/80 via-white/75 to-sky-100/80',
    borderClass: 'border-cyan-400/35',
    dotClass: 'bg-cyan-500',
  },
  3: {
    kicker: 'Asynchronous Traces',
    summary:
      'Design what visitors can leave behind through notes, guestbooks, and traces.',
    panelClass: 'from-lime-100/75 via-white/75 to-emerald-100/75',
    borderClass: 'border-emerald-400/35',
    dotClass: 'bg-emerald-500',
  },
  4: {
    kicker: 'Cross-Site Events',
    summary:
      'Connect projects together with custom events and shared behaviors.',
    panelClass: 'from-violet-100/75 via-white/75 to-indigo-100/75',
    borderClass: 'border-indigo-400/35',
    dotClass: 'bg-indigo-500',
  },
  5: {
    kicker: 'Showcase + Celebration',
    summary: 'Polish, present, and celebrate completed web benches together.',
    panelClass: 'from-amber-100/80 via-white/75 to-yellow-100/80',
    borderClass: 'border-amber-400/35',
    dotClass: 'bg-amber-500',
  },
};

const AVAILABLE_WEEKS = Object.keys(WEEK_CONTENT)
  .map((path) => {
    const match = path.match(/week-(\d+)\.mdx$/);
    return match ? Number(match[1]) : null;
  })
  .filter((week): week is number => week !== null)
  .sort((a, b) => a - b);

interface WeekNavProps {
  previousWeek: number | null;
  nextWeek: number | null;
}

function WeekNav({ previousWeek, nextWeek }: WeekNavProps) {
  return (
    <nav className="mt-8 flex flex-wrap items-center gap-3">
      {previousWeek !== null ? (
        <Link
          to={`/week/${previousWeek}`}
          className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-[#e00000] no-underline hover:underline"
        >
          ← Previous Week
        </Link>
      ) : (
        <span className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-[#e00000]/30">
          ← Previous Week
        </span>
      )}

      {nextWeek !== null ? (
        <Link
          to={`/week/${nextWeek}`}
          className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-[#e00000] no-underline hover:underline"
        >
          Next Week →
        </Link>
      ) : (
        <span className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-[#e00000]/30">
          Next Week →
        </span>
      )}
    </nav>
  );
}

export default function Week() {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const weekNumberValue = weekNumber ? Number(weekNumber) : null;
  const modulePath = weekNumber
    ? `../content/weeks/week-${weekNumber}.mdx`
    : '';
  const weekModule = weekNumber ? WEEK_CONTENT[modulePath] : undefined;
  const title = weekModule?.meta?.title ?? `Week ${weekNumber}`;
  const Content = weekModule?.default;
  const visual =
    weekNumberValue !== null && !Number.isNaN(weekNumberValue)
      ? WEEK_VISUALS[weekNumberValue]
      : undefined;
  const summary =
    weekModule?.meta?.summary ??
    visual?.summary ??
    'Explore this week and continue building your shared web space.';
  const previousWeek =
    weekNumberValue === null || Number.isNaN(weekNumberValue)
      ? null
      : AVAILABLE_WEEKS.filter((value) => value < weekNumberValue).at(-1) ??
        null;
  const nextWeek =
    weekNumberValue === null || Number.isNaN(weekNumberValue)
      ? null
      : AVAILABLE_WEEKS.find((value) => value > weekNumberValue) ?? null;

  return (
    <div className="min-h-screen pb-12">
      <header className="px-8 pb-5 pt-8">
        <div className="mx-auto max-w-4xl">
          <section className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e00000]/80">
              Week {weekNumber}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold uppercase leading-tight text-[#e00000] md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 md:text-base">
              {summary}
            </p>
          </section>
        </div>
      </header>

      <div className="px-8">
        <div className="mx-auto max-w-4xl">
          {Content ? (
            <article className="week-content mx-auto">
              <Content />
            </article>
          ) : (
            <section className="mx-auto max-w-3xl p-6">
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
          <WeekNav previousWeek={previousWeek} nextWeek={nextWeek} />
        </div>
      </div>
    </div>
  );
}

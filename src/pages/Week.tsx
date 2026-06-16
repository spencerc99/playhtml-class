// ABOUTME: Per-week class page with examples, live crit zone, and assignment
// ABOUTME: submission area.

import { useEffect, useRef, type ComponentType } from 'react';
import { Link, useParams } from 'react-router';
import { isWeekUnlocked } from '../weekSchedule';

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
    <nav className="mb-8 flex items-center justify-between gap-4 text-base font-bold uppercase tracking-wide text-white md:text-lg">
      <div className="flex-1">
        {previousWeek !== null ? (
          <Link
            to={`/week/${previousWeek}`}
            className="inline-block text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:no-underline"
          >
            ← Previous Week
          </Link>
        ) : null}
      </div>

      <Link
        to="/"
        className="inline-block text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:no-underline"
      >
        Home
      </Link>

      <div className="flex flex-1 justify-end">
        {nextWeek !== null ? (
          <Link
            to={`/week/${nextWeek}`}
            className="inline-block text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:no-underline"
          >
            Next Week →
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export default function Week() {
  const { weekNumber } = useParams<{ weekNumber: string }>();
  const contentRef = useRef<HTMLElement | null>(null);
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
      : (AVAILABLE_WEEKS.filter((value) => value < weekNumberValue).at(-1) ??
        null);
  const nextWeek =
    weekNumberValue === null || Number.isNaN(weekNumberValue)
      ? null
      : (AVAILABLE_WEEKS.find((value) => value > weekNumberValue) ?? null);
  const visibleNextWeek =
    nextWeek !== null && isWeekUnlocked(nextWeek) ? nextWeek : null;

  useEffect(() => {
    const root = contentRef.current;

    if (!root) {
      return;
    }

    const copyButtonText = {
      idle: 'Copy code',
      copied: 'Copied',
      failed: 'Copy failed',
    } as const;

    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.week-copy-button')) {
        return;
      }

      const code = pre.querySelector('code');
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'week-copy-button';
      button.textContent = copyButtonText.idle;
      button.setAttribute('aria-label', 'Copy code block');
      button.dataset.copied = 'false';

      button.addEventListener('click', async () => {
        const codeText = code?.textContent ?? pre.textContent ?? '';

        try {
          await navigator.clipboard.writeText(codeText);
          button.textContent = copyButtonText.copied;
          button.dataset.copied = 'true';
        } catch {
          button.textContent = copyButtonText.failed;
          button.dataset.copied = 'false';
        }

        window.setTimeout(() => {
          button.textContent = copyButtonText.idle;
          button.dataset.copied = 'false';
        }, 1400);
      });

      pre.classList.add('week-copy-target');
      pre.prepend(button);
    });
  }, [weekNumber]);

  return (
    <div className="week-page min-h-screen pb-16">
      <header className="px-6 pb-6 pt-10 md:px-8 md:pb-8 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <section className="py-6 md:py-8">
            <WeekNav previousWeek={previousWeek} nextWeek={visibleNextWeek} />
            <p className="text-2xl font-bold uppercase tracking-[0.12em] text-white md:text-4xl">
              Week {weekNumber}
            </p>
            <h1 className="mt-4 text-5xl font-extrabold uppercase leading-[0.9] text-white md:text-6xl">
              {title}
            </h1>
            <p className="text-white/88 mt-5 max-w-3xl text-base leading-relaxed md:text-xl">
              {summary}
            </p>
          </section>
        </div>
      </header>

      <div className="px-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          {Content ? (
            <article
              ref={contentRef}
              className="week-content bg-white/82 mx-auto px-6 py-8 text-sky-950 backdrop-blur-sm md:px-10 md:py-10"
            >
              <Content />
            </article>
          ) : (
            <section className="bg-white/82 mx-auto max-w-3xl p-6 text-sky-950 backdrop-blur-sm">
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
      </div>
    </div>
  );
}

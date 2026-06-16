// ABOUTME: Homepage — poster-style header, 3D chair viewer, syllabus, and
// ABOUTME: floating stools on the page.

import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import {
  formatUnlockDate,
  isWeekUnlocked,
  weekUnlockDate,
} from '../weekSchedule';

interface WeekContentMeta {
  title?: string;
}

interface WeekContentModule {
  meta?: WeekContentMeta;
}

interface FloatingChairProps {
  id: string;
  className: string;
  canSpin?: boolean;
}

const WEEK_CONTENT = import.meta.glob<WeekContentModule>(
  '../content/weeks/week-*.mdx',
  {
    eager: true,
  },
);

const FLOATING_CHAIR_SIZE = 'w-32 md:w-36';
const HOME_SECTION_FRAME = 'mx-auto w-full max-w-6xl px-6 md:px-8';
const HOME_SECTION_SPACING = 'py-12 md:py-14';
const HOME_SECTION_HEADING =
  'text-5xl font-extrabold uppercase leading-[0.9] text-white md:text-6xl';
const HOME_HERO_HEADING =
  'text-center text-[6.5rem] font-extrabold uppercase leading-[0.82] text-white md:text-[10rem]';
const HOME_TEXTURE_STYLE = {
  '--home-texture-opacity': 0.8,
} as CSSProperties;

const WEEK_LINKS = Object.entries(WEEK_CONTENT)
  .map(([path, module]) => {
    const match = path.match(/week-(\d+)\.mdx$/);
    const number = match ? Number(match[1]) : null;

    if (number === null) {
      return null;
    }

    return {
      number,
      title: module.meta?.title ?? `Week ${number}`,
    };
  })
  .filter((week): week is { number: number; title: string } => week !== null)
  .sort((a, b) => a.number - b.number);

const FLOATING_CHAIRS: FloatingChairProps[] = [
  { id: 'chair-1', className: 'left-[2%] top-10', canSpin: true },
  { id: 'chair-2', className: 'right-[7%] top-20' },
  { id: 'chair-3', className: 'left-[10%] top-[18rem]' },
  { id: 'chair-4', className: 'right-[18%] top-[24rem]', canSpin: true },
  { id: 'chair-5', className: 'left-[4%] top-[34rem]' },
  { id: 'chair-6', className: 'right-[3%] top-[40rem]' },
  { id: 'chair-7', className: 'left-[14%] bottom-[34rem]', canSpin: true },
  { id: 'chair-8', className: 'right-[11%] bottom-[29rem]' },
  { id: 'chair-9', className: 'left-[6%] bottom-[18rem]' },
  { id: 'chair-10', className: 'right-[5%] bottom-[13rem]', canSpin: true },
  { id: 'chair-11', className: 'left-[20%] bottom-12' },
  { id: 'chair-12', className: 'right-[22%] bottom-8' },
];

function FloatingChair({ id, className, canSpin = false }: FloatingChairProps) {
  return (
    <img
      id={id}
      src="/red-stool.png"
      can-move=""
      {...(canSpin ? { 'can-spin': '' } : {})}
      can-move-bounds="home-stage"
      draggable={false}
      className={`absolute z-10 cursor-move opacity-95 ${FLOATING_CHAIR_SIZE} ${className}`}
    />
  );
}

export default function Home() {
  return (
    <div
      id="home-stage"
      className="home-page relative min-h-screen overflow-hidden"
      style={HOME_TEXTURE_STYLE}
    >
      {FLOATING_CHAIRS.map((chair) => (
        <FloatingChair key={chair.id} {...chair} />
      ))}

      {/* Header — poster layout */}
      <header
        className={`pointer-events-none relative z-20 ${HOME_SECTION_SPACING}`}
      >
        <div
          className={`${HOME_SECTION_FRAME} flex flex-col gap-10 md:flex-row md:items-start md:justify-between`}
        >
          <a
            href="https://sfpc.io"
            className="pointer-events-auto text-xl font-bold uppercase leading-tight text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:no-underline md:text-2xl"
          >
            School
            <br />
            for Poetic
            <br />
            Computation
          </a>
          <h1 className={HOME_HERO_HEADING}>
            Building
            <br />
            Benches
            <br />
            for the Web
          </h1>
          <p className="text-right text-xl font-bold uppercase leading-tight text-white md:text-2xl">
            Summer
            <br />
            2026
          </p>
        </div>
      </header>

      {/* Bottom credits row */}
      <div
        className={`pointer-events-none relative z-20 ${HOME_SECTION_FRAME} ${HOME_SECTION_SPACING} flex items-end justify-between gap-4`}
      >
        <a
          href="https://spencer.place"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto text-xl font-bold uppercase leading-tight text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:no-underline md:text-2xl"
        >
          Spencer
          <br />
          Chang
        </a>
        <p className="text-center text-xl font-bold uppercase text-white md:text-2xl">
          class.playhtml.fun
        </p>
        <a
          href="https://www.munusshih.com/"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto text-right text-xl font-bold uppercase leading-tight text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:no-underline md:text-2xl"
        >
          Munus
          <br />
          Shih
        </a>
      </div>

      {/* Weekly route links */}
      <section
        className={`pointer-events-none relative z-20 ${HOME_SECTION_SPACING}`}
      >
        <div className={`pointer-events-auto ${HOME_SECTION_FRAME}`}>
          <h2 className={`${HOME_SECTION_HEADING} mb-6`}>Weekly View</h2>
          <div className="w-full divide-y-2 divide-white/55">
            {WEEK_LINKS.map((week) => {
              const unlocked = isWeekUnlocked(week.number);
              const unlockDate = weekUnlockDate(week.number);

              if (!unlocked) {
                return (
                  <div
                    key={week.number}
                    className="flex w-full items-end justify-between gap-6 px-0 py-5 text-white/40"
                  >
                    <p className="shrink-0 text-2xl font-bold uppercase leading-tight md:text-4xl">
                      Week {week.number}
                    </p>
                    <p className="text-right text-2xl font-bold uppercase leading-tight md:text-4xl">
                      🔒 Unlocks{' '}
                      {unlockDate ? formatUnlockDate(unlockDate) : ''}
                    </p>
                  </div>
                );
              }

              return (
                <Link
                  key={week.number}
                  to={`/week/${week.number}`}
                  className="hover:bg-white/12 group flex w-full items-end justify-between gap-6 px-0 py-5 no-underline transition duration-200 hover:no-underline hover:shadow-[0_0_28px_rgba(255,255,255,0.28),inset_0_0_0_2px_rgba(255,255,255,0.55)]"
                >
                  <p className="shrink-0 text-2xl font-bold uppercase leading-tight text-white transition duration-200 group-hover:text-white md:text-4xl">
                    Week {week.number}
                  </p>
                  <p className="text-right text-2xl font-bold uppercase leading-tight text-white transition duration-200 md:text-4xl">
                    {week.title}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className={`colophon bg-white/72 pointer-events-none relative z-20 w-full ${HOME_SECTION_SPACING} text-sm leading-relaxed text-sky-950`}
      >
        <div className={`pointer-events-auto ${HOME_SECTION_FRAME}`}>
          <h2 className={HOME_SECTION_HEADING}>Colophon</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-sky-950">
            The Home page uses Healing the Web A by Rainbow Unicorn Studio and
            Jakub Kanior.
          </p>
          <p className="mt-3 text-base text-sky-950">
            Source:{' '}
            <a
              href="https://github.com/rainbowunicornstudio/healtheweb-typeface"
              target="_blank"
              rel="noreferrer"
            >
              rainbowunicornstudio/healtheweb-typeface
            </a>
          </p>
          <p className="mt-2 text-base text-sky-950">
            License:{' '}
            <a
              href="https://www.mozilla.org/en-US/MPL/2.0/"
              target="_blank"
              rel="noreferrer"
            >
              MPL-2.0
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

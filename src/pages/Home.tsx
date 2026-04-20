// ABOUTME: Homepage — poster-style header, 3D chair viewer, syllabus, and
// ABOUTME: draggable stools on the margins.

import { Link } from 'react-router';
import { ChairViewer } from '../ChairViewer';

const WEEK_LINKS = [
  { number: 0, title: 'Welcome Letter' },
  { number: 1, title: 'Step Inside / Intro to PlayHTML' },
  { number: 2, title: 'Sync — Move, Live Cursors' },
  { number: 3, title: 'Async — Guestbooks, Notes' },
  { number: 4, title: 'Custom Events' },
  { number: 5, title: 'Party!' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Draggable stools scattered on margins */}
      <img
        id="chair-1"
        src="/red-stool.png"
        can-move=""
        draggable={false}
        className="absolute w-20"
        style={{ top: '60px', left: '20px' }}
      />
      <img
        id="chair-2"
        src="/red-stool.png"
        can-move=""
        draggable={false}
        className="absolute w-20"
        style={{ top: '400px', right: '30px' }}
      />
      <img
        id="chair-3"
        src="/red-stool.png"
        can-move=""
        draggable={false}
        className="absolute w-20"
        style={{ top: '800px', left: '40px' }}
      />
      <img
        id="chair-4"
        src="/red-stool.png"
        can-move=""
        draggable={false}
        className="absolute w-20"
        style={{ top: '1200px', right: '50px' }}
      />
      <img
        id="chair-5"
        src="/red-stool.png"
        can-move=""
        draggable={false}
        className="absolute w-20"
        style={{ top: '1600px', left: '25px' }}
      />
      <img
        id="chair-6"
        src="/red-stool.png"
        can-move=""
        draggable={false}
        className="absolute w-20"
        style={{ top: '2000px', right: '35px' }}
      />

      {/* Header — poster layout */}
      <header className="px-8 pb-4 pt-10">
        <div className="flex items-start justify-between">
          <p className="text-lg font-bold uppercase leading-tight text-[#e00000]">
            School
            <br />
            for Poetic
            <br />
            Computation
          </p>
          <h1 className="text-center text-5xl font-extrabold uppercase leading-none text-[#e00000] md:text-6xl">
            Building
            <br />
            Benches
            <br />
            for the Web
          </h1>
          <p className="text-right text-lg font-bold uppercase leading-tight text-[#e00000]">
            Summer
            <br />
            2026
          </p>
        </div>
      </header>

      {/* 3D Viewer */}
      <div className="flex justify-center py-6">
        <ChairViewer />
      </div>

      {/* Bottom credits row */}
      <div className="flex items-end justify-between px-8 pb-6">
        <p className="text-lg font-bold uppercase leading-tight text-[#e00000]">
          Spencer
          <br />
          Chang
        </p>
        <p className="text-center text-lg font-bold uppercase text-[#e00000]">
          class.playhtml.fun
        </p>
        <p className="text-right text-lg font-bold uppercase leading-tight text-[#e00000]">
          Munus
          <br />
          Shih
        </p>
      </div>

      {/* Weekly route links */}
      <div className="mx-auto max-w-2xl px-8 pb-10">
        <h2 className="mb-5 text-3xl font-extrabold uppercase text-[#e00000]">
          Weekly View
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {WEEK_LINKS.map((week) => (
            <Link
              key={week.number}
              to={`/week/${week.number}`}
              className="rounded-xl bg-white/70 px-4 py-3 no-underline transition hover:bg-white hover:no-underline"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#e00000]/80">
                Week {week.number}
              </p>
              <p className="text-base font-bold uppercase leading-tight text-[#e00000]">
                {week.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

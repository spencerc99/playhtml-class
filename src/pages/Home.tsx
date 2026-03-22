// ABOUTME: Homepage — poster-style header, 3D chair viewer, syllabus, and
// ABOUTME: draggable stools on the margins.

import { ChairViewer } from '../ChairViewer';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Draggable stools scattered on margins */}
      <img id="chair-1" src="/red-stool.png" can-move="" draggable={false}
        className="absolute w-20" style={{ top: '60px', left: '20px' }} />
      <img id="chair-2" src="/red-stool.png" can-move="" draggable={false}
        className="absolute w-20" style={{ top: '400px', right: '30px' }} />
      <img id="chair-3" src="/red-stool.png" can-move="" draggable={false}
        className="absolute w-20" style={{ top: '800px', left: '40px' }} />
      <img id="chair-4" src="/red-stool.png" can-move="" draggable={false}
        className="absolute w-20" style={{ top: '1200px', right: '50px' }} />
      <img id="chair-5" src="/red-stool.png" can-move="" draggable={false}
        className="absolute w-20" style={{ top: '1600px', left: '25px' }} />
      <img id="chair-6" src="/red-stool.png" can-move="" draggable={false}
        className="absolute w-20" style={{ top: '2000px', right: '35px' }} />

      {/* Header — poster layout */}
      <header className="px-8 pt-10 pb-4">
        <div className="flex items-start justify-between">
          <p className="text-lg font-bold uppercase leading-tight text-[#e00000]">School<br />for Poetic<br />Computation</p>
          <h1 className="text-center text-5xl font-extrabold uppercase leading-none text-[#e00000] md:text-6xl">Building<br />Benches<br />for the Web</h1>
          <p className="text-right text-lg font-bold uppercase leading-tight text-[#e00000]">Summer<br />2026</p>
        </div>
      </header>

      {/* 3D Viewer */}
      <div className="flex justify-center py-6">
        <ChairViewer />
      </div>

      {/* Bottom credits row */}
      <div className="flex items-end justify-between px-8 pb-6">
        <p className="text-lg font-bold uppercase leading-tight text-[#e00000]">Spencer<br />Chang</p>
        <p className="text-center text-lg font-bold uppercase text-[#e00000]">class.playhtml.fun</p>
        <p className="text-right text-lg font-bold uppercase leading-tight text-[#e00000]">Munus<br />Shih</p>
      </div>

      {/* Syllabus */}
      <div className="mx-auto max-w-2xl px-8 pb-20">
        <h2 className="mb-8 text-3xl font-extrabold uppercase text-[#e00000]">Syllabus</h2>

        <div className="space-y-10">
          <section>
            <h3 className="mb-3 text-xl font-extrabold uppercase text-[#e00000]">Week 0: Welcome Letter (Prior to the First Class)</h3>
            <p className="mb-2 font-bold uppercase text-sm tracking-wide text-[#e00000]">Assignment / Readings:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>What to download:
                <ul className="ml-5 list-disc">
                  <li>VS Code or if you want to try AI: Cursor</li>
                  <li>Google Chrome</li>
                  <li>Github Desktop?</li>
                </ul>
              </li>
              <li>Send a tutorial to watch beforehand</li>
              <li>Read: <a href="https://esl.uchicago.edu/2023/11/01/third-places-what-are-they-and-why-are-they-important-to-american-culture/">Third Places: What Are They and Why Are They Important to American Culture?</a></li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-xl font-extrabold uppercase text-[#e00000]">Week 1: Step Inside / Introduction to PlayHTML</h3>
            <p className="mb-2 font-bold uppercase text-sm tracking-wide text-[#e00000]">Activities:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Introduction</li>
              <li>Community Agreement</li>
              <li>Discussion: <a href="https://esl.uchicago.edu/2023/11/01/third-places-what-are-they-and-why-are-they-important-to-american-culture/">Third Places: What Are They and Why Are They Important to American Culture?</a></li>
              <li>AI + Open Source Policy</li>
              <li>Environment Setup, HTML & PlayHTML</li>
              <li>Launch their site to a live domain: Github Pages, Cloudflare, etc.
                <ul className="ml-5 list-disc">
                  <li>Get the default website link</li>
                  <li>(Optionally) they can come with a custom domain and set it up (or do it later)</li>
                </ul>
              </li>
            </ul>
            <p className="mb-2 mt-4 font-bold uppercase text-sm tracking-wide text-[#e00000]">Assignment / Readings:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Identify a physical communal space they want to re-create digitally.</li>
              <li>Note the attributes, interactions, or elements that define that space.</li>
              <li>Read: <a href="https://www.mediastudies.asia/wp-content/uploads/2017/02/Sherry_Turkle_Alone_Together.pdf">Alone Together (2011), Sherry Turkle. Chapter 8: Always On, p151–162</a></li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-xl font-extrabold uppercase text-[#e00000]">Week 2: Sync — Move, Live Cursors</h3>
            <p className="mb-2 font-bold uppercase text-sm tracking-wide text-[#e00000]">Activities:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Crit & discussion in small groups:
                <ul className="ml-5 list-disc">
                  <li>Share communal-space concepts</li>
                  <li>Discuss Readings</li>
                </ul>
              </li>
              <li>Demo/lecture:
                <ul className="ml-5 list-disc">
                  <li>Synchronous behaviors (move, drag, live cursors, presence)</li>
                </ul>
              </li>
              <li>Mini in-class coding challenge</li>
              <li>Debugging & Q+A</li>
            </ul>
            <p className="mb-2 mt-4 font-bold uppercase text-sm tracking-wide text-[#e00000]">Assignment / Readings:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Build a small synchronous interaction inspired by their communal space.</li>
              <li>Read: <a href="https://macwright.com/2025/02/06/the-web-is-already-multiplayer">The web is already multiplayer — macwright.com</a></li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-xl font-extrabold uppercase text-[#e00000]">Week 3: Async — Guestbooks, Notes</h3>
            <p className="mb-2 font-bold uppercase text-sm tracking-wide text-[#e00000]">Activities:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Crit & discussion in small groups:
                <ul className="ml-5 list-disc">
                  <li>Share prototypes</li>
                  <li>Discuss Readings</li>
                </ul>
              </li>
              <li>Demo/lecture:
                <ul className="ml-5 list-disc">
                  <li>Asynchronous tools (guestbooks, notes, leaving traces)</li>
                </ul>
              </li>
              <li>Mini in-class coding challenge</li>
              <li>Debugging & Q+A</li>
            </ul>
            <p className="mb-2 mt-4 font-bold uppercase text-sm tracking-wide text-[#e00000]">Assignment / Readings:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Add at least one asynchronous interaction to their site (guestbook, notes, graffiti, etc.).</li>
              <li>Read: TKTKTKTKT</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-xl font-extrabold uppercase text-[#e00000]">Week 4: Custom Events</h3>
            <p className="mb-2 font-bold uppercase text-sm tracking-wide text-[#e00000]">Activities:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Crit & discussion in small groups:
                <ul className="ml-5 list-disc">
                  <li>Share prototypes</li>
                  <li>Discuss Readings</li>
                </ul>
              </li>
              <li>Demo/lecture:
                <ul className="ml-5 list-disc">
                  <li>Creating custom events between sites, cross-site interactions</li>
                </ul>
              </li>
              <li>Mini challenge</li>
              <li>Debugging & Q+A</li>
            </ul>
            <p className="mb-2 mt-4 font-bold uppercase text-sm tracking-wide text-[#e00000]">Assignment / Readings:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Finalize their site</li>
              <li>(Optional) Implement one custom event or shared behavior that interacts with others' sites.</li>
              <li>Read: TKTKTKTKT</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-xl font-extrabold uppercase text-[#e00000]">Week 5: Party!</h3>
            <p className="mb-2 font-bold uppercase text-sm tracking-wide text-[#e00000]">Activities:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Final crit & discussion!</li>
              <li>Town showcase / celebration!</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

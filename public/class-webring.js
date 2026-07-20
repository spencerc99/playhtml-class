// ABOUTME: One-tag class web-ring embed for participant and external websites.
// ABOUTME: Renders the Showcase registry as a small, read-only orbit of links.
/* eslint-disable import/no-unresolved, no-inner-declarations -- This standalone
   browser module imports from a CDN and scopes its helpers to one widget. */

import { playhtml as importedPlayhtml } from 'https://unpkg.com/playhtml';

const SCRIPT_URL = new URL(import.meta.url);
const scriptElement = [...document.scripts].find((script) => {
  try {
    return new URL(script.src).href === SCRIPT_URL.href;
  } catch {
    return false;
  }
});

if (!document.querySelector('[data-class-webring-widget]')) {
  const playhtml = window.playhtml ?? importedPlayhtml;
  const configuredRegistry = scriptElement?.dataset.registry?.trim();
  const registryLocation = configuredRegistry
    ? configuredRegistry.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : SCRIPT_URL.host;
  const dataSource = `${registryLocation}/showcase#student-projects`;
  const isRegistryPage =
    window.location.host === registryLocation &&
    window.location.pathname.replace(/\/$/, '') === '/showcase';
  const demoMode = scriptElement?.dataset.demo === 'true';
  const debugMode = scriptElement?.dataset.debug === 'true';
  const variant =
    scriptElement?.dataset.variant === 'expandable' ? 'expandable' : 'peek';
  const label = 'Benches for the Internet';
  const widget = document.createElement('aside');
  const registryDataEvent = 'class-webring:registry-data';
  const registryDataRequestEvent = 'class-webring:request-data';
  let expanded = scriptElement?.dataset.expanded === 'true';
  let latestProjects = [];

  const demoProjects = [
    {
      id: 'demo-garden',
      name: 'Mina',
      title: 'Night Garden',
      url: 'https://example.com/garden',
      emoji: '🌱',
      imageUrl: new URL('/pixel-bunny.png', SCRIPT_URL).href,
      accentColor: '#7a9574',
      submittedAt: 1,
    },
    {
      id: 'demo-radio',
      name: 'Jun',
      title: 'Kitchen Radio',
      url: 'https://example.com/radio',
      emoji: '📻',
      imageUrl: new URL('/red-stool.png', SCRIPT_URL).href,
      accentColor: '#c0373c',
      submittedAt: 2,
    },
    {
      id: 'demo-moon',
      name: 'Ari',
      title: 'Moon Room',
      url: 'https://example.com/moon',
      emoji: '🌙',
      imageUrl: new URL('/demo/cat.jpg', SCRIPT_URL).href,
      accentColor: '#274b9e',
      submittedAt: 3,
    },
    {
      id: 'demo-library',
      name: 'Sol',
      title: 'Tiny Library',
      url: 'https://example.com/library',
      emoji: '📚',
      imageUrl: new URL('/persian-rug.png', SCRIPT_URL).href,
      accentColor: '#e8a63a',
      submittedAt: 4,
    },
  ];

  function safeUrl(value) {
    if (typeof value !== 'string') return null;

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  function safeText(value, limit, fallback = '') {
    return typeof value === 'string' ? value.slice(0, limit) : fallback;
  }

  function safeColor(value, fallback) {
    return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
      ? value
      : fallback;
  }

  function faviconUrl(projectUrl) {
    try {
      return new URL('/favicon.ico', projectUrl).href;
    } catch {
      return null;
    }
  }

  function cachedFaviconUrl(projectUrl) {
    try {
      const { hostname } = new URL(projectUrl);
      return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
    } catch {
      return null;
    }
  }

  function sanitizeProjects(data) {
    const records = data?.projects;
    if (!records || typeof records !== 'object') return [];

    return Object.values(records)
      .flatMap((project, index) => {
        if (!project || typeof project !== 'object') return [];
        const url = safeUrl(project.url);
        const title = safeText(project.title, 120);
        if (!url || !title) return [];

        return [
          {
            id: safeText(project.id, 100, `project-${index}`),
            name: safeText(project.name, 80, 'someone'),
            title,
            url,
            emoji: safeText(project.emoji, 12, '✦'),
            faviconUrl: faviconUrl(url),
            cachedFaviconUrl: cachedFaviconUrl(url),
            imageUrl: safeUrl(project.imageUrl),
            accentColor: safeColor(project.accentColor, '#274b9e'),
            submittedAt:
              typeof project.submittedAt === 'number'
                ? project.submittedAt
                : index,
          },
        ];
      })
      .sort((left, right) => left.submittedAt - right.submittedAt);
  }

  function normalizeLocation(value) {
    try {
      const url = new URL(value);
      return `${url.host}${url.pathname.replace(/\/$/, '')}`;
    } catch {
      return '';
    }
  }

  function makeLink(project, className) {
    const link = document.createElement('a');
    link.className = className;
    link.href = project.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function appendProjectImage(container, project) {
    const imageSources = [
      project.faviconUrl,
      project.cachedFaviconUrl,
      project.imageUrl,
    ].filter(
      (source, index, sources) => source && sources.indexOf(source) === index,
    );
    if (imageSources.length === 0) return;

    const image = document.createElement('img');
    let sourceIndex = 0;
    image.src = imageSources[sourceIndex];
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      sourceIndex += 1;
      if (imageSources[sourceIndex]) {
        image.src = imageSources[sourceIndex];
      } else {
        image.remove();
      }
    });
    container.append(image);
  }

  function makeExpandableCircle(project, className) {
    const link = makeLink(project, className);
    link.style.setProperty('--ring-color', project.accentColor);
    link.setAttribute('aria-label', `${project.title} by ${project.name}`);

    const fallback = document.createElement('span');
    fallback.textContent = project.emoji;
    link.append(fallback);

    appendProjectImage(link, project);

    const tooltip = document.createElement('em');
    tooltip.textContent = project.name;
    link.append(tooltip);
    return link;
  }

  function makeProjectLink(project, index, total) {
    const link = document.createElement('a');
    link.className = 'class-webring-widget__link';
    link.href = project.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${project.title} by ${project.name}`);
    link.style.setProperty('--ring-color', project.accentColor);
    link.style.setProperty('--ring-delay', `${index * -0.17}s`);
    link.style.setProperty('--ring-tilt', `${((index % 5) - 2) * 2.5}deg`);

    const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
    link.style.left = `${50 + Math.cos(angle) * 37}%`;
    link.style.top = `${50 + Math.sin(angle) * 37}%`;

    const disc = document.createElement('span');
    disc.className = 'class-webring-widget__disc';

    const fallback = document.createElement('span');
    fallback.className = 'class-webring-widget__fallback';
    fallback.textContent = project.emoji;
    disc.append(fallback);

    appendProjectImage(disc, project);

    link.append(disc);
    return link;
  }

  function makeCenterLink(project) {
    const link = document.createElement('a');
    link.className = 'class-webring-widget__center';
    link.href = project?.url ?? new URL('/showcase', SCRIPT_URL).href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute(
      'aria-label',
      project ? `Visit ${project.title}` : 'Visit the class Showcase',
    );
    link.textContent = '✦';
    return link;
  }

  function renderPeek() {
    const projects =
      latestProjects.length > 0 ? latestProjects : demoMode ? demoProjects : [];
    const visibleProjects = projects.slice(0, 8);
    const randomProject =
      projects.length > 0
        ? projects[Math.floor(Math.random() * projects.length)]
        : null;

    widget.replaceChildren();
    widget.className = 'class-webring-widget class-webring-widget--peek';

    const orbit = document.createElement('div');
    orbit.className = 'class-webring-widget__orbit';
    visibleProjects.forEach((project, index) => {
      orbit.append(makeProjectLink(project, index, visibleProjects.length));
    });

    widget.append(orbit, makeCenterLink(randomProject));
  }

  function renderExpandable() {
    const projects =
      latestProjects.length > 0 ? latestProjects : demoMode ? demoProjects : [];

    widget.replaceChildren();
    widget.className = `class-webring-widget class-webring-widget--expandable${
      expanded ? ' is-expanded' : ''
    }`;

    if (!expanded) {
      const miniature = document.createElement('div');
      miniature.className = 'class-webring-widget__miniature';
      const miniOrbit = document.createElement('div');
      miniOrbit.className = 'class-webring-widget__mini-orbit';
      const compactProjects = projects.slice(0, 12);
      compactProjects.forEach((project, index) => {
        const angle =
          (index / Math.max(compactProjects.length, 1)) * Math.PI * 2;
        const circle = makeExpandableCircle(
          project,
          'class-webring-widget__circle class-webring-widget__circle--mini',
        );
        circle.style.left = `${50 + Math.cos(angle) * 35}%`;
        circle.style.top = `${50 + Math.sin(angle) * 35}%`;
        miniOrbit.append(circle);
      });

      const toggle = document.createElement('button');
      toggle.className = 'class-webring-widget__toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      const sparkle = document.createElement('span');
      sparkle.textContent = '✦';
      toggle.append(sparkle, document.createTextNode(label));
      toggle.addEventListener('click', () => {
        expanded = true;
        renderExpandable();
      });
      miniature.append(miniOrbit, toggle);
      widget.append(miniature);
      return;
    }

    const panel = document.createElement('section');
    panel.className = 'class-webring-widget__world';
    panel.setAttribute('aria-label', label);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'class-webring-widget__close';
    close.setAttribute('aria-label', 'Close web ring');
    close.textContent = '×';
    close.addEventListener('click', () => {
      expanded = false;
      renderExpandable();
    });
    panel.append(close);

    const center = document.createElement('div');
    center.className = 'class-webring-widget__expanded-center';
    const eyebrow = document.createElement('small');
    eyebrow.textContent = 'A neighborhood of independent sites';
    const title = document.createElement('strong');
    title.textContent = label;
    center.append(eyebrow, title);
    panel.append(center);

    if (projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'class-webring-widget__empty';
      empty.textContent = 'The ring is waiting for its first place.';
      panel.append(empty);
      widget.append(panel);
      return;
    }

    const circles = document.createElement('div');
    circles.className = 'class-webring-widget__circles';
    projects.forEach((project, index) => {
      const maxPerOrbit = 16;
      const orbitIndex = Math.floor(index / maxPerOrbit);
      const itemIndex = index % maxPerOrbit;
      const itemsInOrbit = Math.min(
        maxPerOrbit,
        projects.length - orbitIndex * maxPerOrbit,
      );
      const angle =
        (itemIndex / Math.max(itemsInOrbit, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.max(22, 44 - orbitIndex * 11);
      const circle = makeExpandableCircle(
        project,
        'class-webring-widget__circle class-webring-widget__circle--large',
      );
      circle.style.left = `${50 + Math.cos(angle) * radius}%`;
      circle.style.top = `${50 + Math.sin(angle) * radius}%`;
      circle.style.setProperty('--ring-delay', `${index * -0.08}s`);
      circles.append(circle);
    });
    panel.append(circles);

    const currentLocation = normalizeLocation(window.location.href);
    const currentIndex = projects.findIndex(
      (project) => normalizeLocation(project.url) === currentLocation,
    );
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const previous =
      projects[(baseIndex - 1 + projects.length) % projects.length];
    const next = projects[(baseIndex + 1) % projects.length];
    const random = projects[Math.floor(Math.random() * projects.length)];
    const navigation = document.createElement('nav');
    navigation.className = 'class-webring-widget__nav';

    const previousLink = makeLink(previous, 'class-webring-widget__nav-link');
    previousLink.textContent = `← ${previous.name}`;
    const randomLink = makeLink(random, 'class-webring-widget__nav-link');
    randomLink.textContent = 'Random ✦';
    const nextLink = makeLink(next, 'class-webring-widget__nav-link');
    nextLink.textContent = `${next.name} →`;
    navigation.append(previousLink, randomLink, nextLink);
    panel.append(navigation);
    widget.append(panel);
  }

  function updateProjects(data, source) {
    latestProjects = sanitizeProjects(data);
    if (variant === 'expandable') {
      renderExpandable();
    } else {
      renderPeek();
    }

    widget.dataset.projectCount = String(latestProjects.length);
    window.dispatchEvent(
      new CustomEvent('class-webring:update', {
        detail: { projectCount: latestProjects.length },
      }),
    );
    if (debugMode) {
      console.info('[class-webring] registry updated', {
        dataSource,
        projectCount: latestProjects.length,
        source,
      });
    }
  }

  const style = document.createElement('style');
  style.dataset.classWebringStyle = '';
  style.textContent = `
    .class-webring-widget {
      --ring-paper: #f4efe5;
      --ring-ink: #1c1c1c;
      --ring-blue: #274b9e;
      z-index: 2147483000;
    }
    .class-webring-widget *,
    .class-webring-widget *::before,
    .class-webring-widget *::after { box-sizing: border-box; }
    .class-webring-widget--peek {
      bottom: -4.4rem;
      height: 8rem;
      position: fixed;
      right: -4.4rem;
      transform: rotate(-105deg) scale(.78);
      transition:
        bottom .5s cubic-bezier(.2, .8, .3, 1),
        right .5s cubic-bezier(.2, .8, .3, 1),
        transform .6s cubic-bezier(.2, .8, .3, 1);
      width: 8rem;
    }
    .class-webring-widget--peek:hover,
    .class-webring-widget--peek:focus-within {
      bottom: .55rem;
      right: .55rem;
      transform: rotate(0) scale(1);
    }
    .class-webring-widget__orbit {
      animation: class-webring-spin 48s linear infinite;
      inset: 0;
      position: absolute;
    }
    .class-webring-widget__link {
      height: 1.85rem;
      position: absolute;
      transform: translate(-50%, -50%);
      width: 1.85rem;
    }
    .class-webring-widget__disc {
      align-items: center;
      animation: class-webring-counter-spin 48s linear infinite;
      background: color-mix(in srgb, var(--ring-color) 30%, var(--ring-paper));
      border: 1.5px solid var(--ring-ink);
      border-radius: 50%;
      box-shadow: 2px 2px 0 var(--ring-ink);
      color: var(--ring-ink);
      display: flex;
      font: .85rem/1 system-ui, sans-serif;
      height: 100%;
      justify-content: center;
      overflow: hidden;
      transform: rotate(var(--ring-tilt));
      transition: box-shadow .12s cubic-bezier(.2, .8, .3, 1), transform .12s cubic-bezier(.2, .8, .3, 1);
      width: 100%;
    }
    .class-webring-widget__link:hover,
    .class-webring-widget__link:focus-visible { z-index: 2; }
    .class-webring-widget__link:hover .class-webring-widget__disc,
    .class-webring-widget__link:focus-visible .class-webring-widget__disc {
      box-shadow: 4px 4px 0 var(--ring-ink);
      outline: 3px solid var(--ring-paper);
      transform: translate(-2px, -2px) rotate(var(--ring-tilt)) scale(1.18);
    }
    .class-webring-widget__link:focus-visible { outline: none; }
    .class-webring-widget__disc img {
      border-radius: inherit;
      height: 100%;
      inset: 0;
      object-fit: cover;
      position: absolute;
      width: 100%;
    }
    .class-webring-widget__fallback { position: relative; }
    .class-webring-widget__center {
      align-items: center;
      background: var(--ring-paper);
      border: 1.5px solid var(--ring-ink);
      border-radius: 50%;
      box-shadow: 2px 2px 0 var(--ring-ink);
      color: var(--ring-blue);
      display: flex;
      font: 700 .85rem/1 ui-monospace, monospace;
      height: 1.75rem;
      justify-content: center;
      left: 50%;
      position: absolute;
      text-decoration: none;
      top: 50%;
      transform: translate(-50%, -50%) rotate(-8deg);
      transition: box-shadow .12s cubic-bezier(.2, .8, .3, 1), transform .12s cubic-bezier(.2, .8, .3, 1);
      width: 1.75rem;
      z-index: 3;
    }
    .class-webring-widget__center:hover,
    .class-webring-widget__center:focus-visible {
      box-shadow: 4px 4px 0 var(--ring-ink);
      outline: 3px solid var(--ring-paper);
      transform: translate(calc(-50% - 2px), calc(-50% - 2px)) rotate(8deg) scale(1.08);
    }
    .class-webring-widget:hover .class-webring-widget__orbit,
    .class-webring-widget:hover .class-webring-widget__disc,
    .class-webring-widget:focus-within .class-webring-widget__orbit,
    .class-webring-widget:focus-within .class-webring-widget__disc {
      animation-play-state: paused;
    }
    .class-webring-widget--expandable {
      bottom: .65rem;
      color: #382c28;
      font-family: Georgia, 'Times New Roman', serif;
      position: fixed;
      right: .65rem;
    }
    .class-webring-widget__miniature {
      height: 10rem;
      position: relative;
      width: 10rem;
    }
    .class-webring-widget__mini-orbit {
      animation: class-webring-spin 45s linear infinite;
      inset: 0;
      position: absolute;
    }
    .class-webring-widget__toggle {
      background: transparent;
      border: 0;
      color: currentColor;
      cursor: pointer;
      font: italic .8rem/1.1 Georgia, serif;
      left: 50%;
      padding: .5rem;
      position: absolute;
      text-align: center;
      text-decoration: underline dotted;
      text-underline-offset: .22rem;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 5.5rem;
    }
    .class-webring-widget__toggle span {
      color: #e00000;
      display: block;
      font-style: normal;
      margin-bottom: .15rem;
    }
    .class-webring-widget--expandable.is-expanded {
      inset: 0;
      position: fixed;
    }
    .class-webring-widget__world {
      animation: class-webring-in .3s ease-out;
      background:
        radial-gradient(circle at 50% 48%, rgba(255,255,255,.96) 0 8%, transparent 35%),
        radial-gradient(circle at 20% 15%, rgba(255,190,153,.27), transparent 28%),
        radial-gradient(circle at 82% 80%, rgba(130,190,198,.24), transparent 29%),
        rgba(255, 250, 232, .97);
      height: 100%;
      overflow: hidden;
      position: relative;
      width: 100%;
    }
    .class-webring-widget__world::before {
      background-image: radial-gradient(circle, rgba(80,45,35,.12) 0 1px, transparent 1.5px);
      background-size: 2.8rem 2.8rem;
      content: '';
      inset: 0;
      opacity: .35;
      pointer-events: none;
      position: absolute;
    }
    .class-webring-widget__expanded-center {
      left: 50%;
      max-width: min(40vw, 34rem);
      position: absolute;
      text-align: center;
      top: 48%;
      transform: translate(-50%, -50%);
      z-index: 2;
    }
    .class-webring-widget__expanded-center small {
      color: #73564d;
      display: block;
      font: .65rem/1.2 Arial, sans-serif;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .class-webring-widget__expanded-center strong {
      color: #e00000;
      display: block;
      font-size: clamp(2.4rem, 7vw, 7rem);
      font-weight: 400;
      letter-spacing: -.06em;
      line-height: .76;
      margin: .6rem 0 1rem;
    }
    .class-webring-widget__close {
      background: transparent;
      border: 0;
      color: #e00000;
      cursor: pointer;
      font: 400 2.2rem/1 Georgia, serif;
      position: absolute;
      right: 1.2rem;
      top: 1rem;
      z-index: 5;
    }
    .class-webring-widget__circles {
      inset: clamp(2rem, 5vw, 5rem);
      position: absolute;
      z-index: 3;
    }
    .class-webring-widget__circle {
      align-items: center;
      background: color-mix(in srgb, var(--ring-color) 18%, white);
      border: 3px solid rgba(255,255,255,.92);
      border-radius: 50%;
      box-shadow: 0 0 1.2rem .35rem color-mix(in srgb, var(--ring-color) 42%, transparent);
      color: #222;
      display: flex;
      justify-content: center;
      position: absolute;
      text-decoration: none;
    }
    .class-webring-widget__circle--mini {
      animation: class-webring-counter-spin 45s linear infinite;
      font-size: 1rem;
      height: 2.35rem;
      margin: -1.175rem 0 0 -1.175rem;
      width: 2.35rem;
    }
    .class-webring-widget__circle--large {
      animation: class-webring-float 4s var(--ring-delay) ease-in-out infinite;
      font-size: clamp(1.9rem, 4.5vw, 3.8rem);
      height: clamp(5.5rem, 12vw, 10.5rem);
      margin: calc(clamp(5.5rem, 12vw, 10.5rem) / -2) 0 0 calc(clamp(5.5rem, 12vw, 10.5rem) / -2);
      transition: filter .18s ease, box-shadow .18s ease;
      width: clamp(5.5rem, 12vw, 10.5rem);
    }
    .class-webring-widget__circle--large:hover,
    .class-webring-widget__circle--large:focus-visible {
      box-shadow: 0 0 2.2rem .8rem color-mix(in srgb, var(--ring-color) 62%, transparent);
      filter: saturate(1.12) brightness(1.04);
      outline: none;
      z-index: 4;
    }
    .class-webring-widget__circle img {
      border-radius: inherit;
      height: 100%;
      inset: 0;
      object-fit: cover;
      position: absolute;
      width: 100%;
    }
    .class-webring-widget__circle em {
      background: rgba(255,255,255,.92);
      border-radius: 999px;
      bottom: -.5rem;
      color: #5d423b;
      font: .6rem/1 Arial, sans-serif;
      font-style: normal;
      left: 50%;
      max-width: 6rem;
      opacity: 0;
      overflow: hidden;
      padding: .25rem .4rem;
      position: absolute;
      text-overflow: ellipsis;
      transform: translateX(-50%);
      transition: opacity .15s ease;
      white-space: nowrap;
      z-index: 2;
    }
    .class-webring-widget__circle:hover em,
    .class-webring-widget__circle:focus-visible em { opacity: 1; }
    .class-webring-widget__circle--mini em { display: none; }
    .class-webring-widget__nav {
      bottom: 1.2rem;
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr auto 1fr;
      left: 50%;
      max-width: 42rem;
      position: absolute;
      transform: translateX(-50%);
      width: calc(100% - 3rem);
      z-index: 5;
    }
    .class-webring-widget__nav-link {
      color: #e00000;
      font: italic .78rem/1.2 Georgia, serif;
      overflow: hidden;
      padding: .35rem .1rem;
      text-decoration: underline dotted;
      text-overflow: ellipsis;
      text-underline-offset: .2rem;
      white-space: nowrap;
    }
    .class-webring-widget__nav-link:last-child { text-align: right; }
    .class-webring-widget__empty {
      left: 50%;
      margin: 4rem 0 0;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
    }
    @keyframes class-webring-in {
      from { opacity: 0; transform: scale(.98); }
    }
    @keyframes class-webring-spin { to { transform: rotate(360deg); } }
    @keyframes class-webring-counter-spin { to { transform: rotate(-360deg); } }
    @keyframes class-webring-float { 50% { translate: 0 -.45rem; } }
    @media (max-width: 520px) {
      .class-webring-widget--peek:hover,
      .class-webring-widget--peek:focus-within { bottom: 3.9rem; }
      .class-webring-widget__miniature { height: 8.5rem; width: 8.5rem; }
      .class-webring-widget__circle--mini {
        height: 2rem;
        margin: -1rem 0 0 -1rem;
        width: 2rem;
      }
      .class-webring-widget__circles { inset: 4.5rem 1rem 6rem; }
      .class-webring-widget__circle--large {
        font-size: 1.55rem;
        height: clamp(3.4rem, 15vw, 4.6rem);
        margin: calc(clamp(3.4rem, 15vw, 4.6rem) / -2) 0 0 calc(clamp(3.4rem, 15vw, 4.6rem) / -2);
        width: clamp(3.4rem, 15vw, 4.6rem);
      }
      .class-webring-widget__expanded-center { max-width: 58vw; }
      .class-webring-widget__expanded-center strong {
        font-size: clamp(2.2rem, 14vw, 4rem);
      }
      .class-webring-widget__expanded-center small { font-size: .52rem; }
      .class-webring-widget__nav { bottom: .75rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .class-webring-widget--peek { transition: none; }
      .class-webring-widget__orbit,
      .class-webring-widget__disc,
      .class-webring-widget__world,
      .class-webring-widget__mini-orbit,
      .class-webring-widget__circle { animation: none; }
    }
  `;

  widget.id = 'class-webring-widget';
  widget.dataset.classWebringWidget = '';
  widget.setAttribute('aria-label', label);
  const handleLocalRegistryData = (event) => {
    updateProjects(event.detail?.data, 'source page');
  };
  window.addEventListener(registryDataEvent, handleLocalRegistryData);

  if (!isRegistryPage) {
    widget.setAttribute('can-play', '');
    widget.setAttribute('data-source', dataSource);
    widget.setAttribute('data-source-read-only', '');
    widget.defaultData = { projects: {} };
    widget.updateElement = ({ data }) => updateProjects(data, 'PlayHTML');
  }

  document.head.append(style);
  document.body.append(widget);
  widget.dataset.projectCount = '0';
  if (variant === 'expandable') {
    renderExpandable();
  } else {
    renderPeek();
  }

  if (isRegistryPage) {
    window.dispatchEvent(new Event(registryDataRequestEvent));
  } else if (playhtml.roomId) {
    playhtml.setupPlayElement(widget);
  } else {
    await playhtml.init();
  }
}

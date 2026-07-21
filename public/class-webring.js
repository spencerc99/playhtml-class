// ABOUTME: One-tag class web-ring embed for participant and external websites.
// ABOUTME: Renders the Showcase registry as a small, read-only orbit of links.
/* eslint-disable import/no-unresolved, no-inner-declarations -- This standalone
   browser module can import from a CDN and scopes its helpers to one widget. */

const SCRIPT_URL = new URL(import.meta.url);
const DISPLAY_FONT_URL = new URL('/fonts/HealTheWebA-Regular.otf', SCRIPT_URL)
  .href;
const scriptElement = [...document.scripts].find((script) => {
  try {
    return new URL(script.src).href === SCRIPT_URL.href;
  } catch {
    return false;
  }
});

if (!document.querySelector('[data-class-webring-widget]')) {
  let playhtml = window.playhtml;
  const configuredRegistry = scriptElement?.dataset.registry?.trim();
  const registryLocation = configuredRegistry
    ? configuredRegistry.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : SCRIPT_URL.host;
  const dataSource = `${registryLocation}/showcase#student-projects`;
  const registryProtocol =
    configuredRegistry?.match(/^https?:\/\//)?.[0] ??
    `${SCRIPT_URL.protocol}//`;
  const playgroundUrl = new URL(
    '/playground',
    `${registryProtocol}${registryLocation}`,
  );
  playgroundUrl.searchParams.set('embed', 'plugin');
  const receivesLocalRegistryData =
    window.location.host === registryLocation &&
    Boolean(document.getElementById('student-projects'));
  let registryMode = receivesLocalRegistryData ? 'local' : 'remote';
  const demoMode = scriptElement?.dataset.demo === 'true';
  if (demoMode) playgroundUrl.searchParams.set('demo', 'true');
  const debugMode = scriptElement?.dataset.debug === 'true';
  const label = 'Building Benches for the Web';
  const widget = document.createElement('aside');
  const registryDataEvent = 'class-webring:registry-data';
  const registryDataRequestEvent = 'class-webring:request-data';
  const registryModeEvent = 'class-webring:registry-mode';
  const declaredIconCache = new Map();
  const maximumCompactProjects = 7;
  let expanded = false;
  let latestProjects = [];

  const demoNames = [
    'Mina',
    'Jun',
    'Ari',
    'Sol',
    'Inez',
    'Bo',
    'Luz',
    'Mori',
    'Nia',
    'Paz',
    'Rae',
    'Tao',
    'Uma',
    'Vale',
    'Wren',
    'Xio',
    'Yara',
    'Zed',
    'Ayo',
    'Bela',
    'Cleo',
    'Dara',
    'Eli',
    'Fia',
    'Geo',
    'Hana',
    'Io',
    'Jae',
    'Koa',
    'Lio',
  ];
  const demoTitles = [
    'Night Garden',
    'Kitchen Radio',
    'Moon Room',
    'Tiny Library',
    'Soft Map',
    'Window Seat',
    'Cloud Index',
    'Listening Table',
    'Pocket Weather',
    'Slow Arcade',
    'Secret Porch',
    'Small Signals',
    'Neighborhood Clock',
    'Shared Blanket',
    'Internet Teahouse',
    'Tender Machine',
    'Moving Meadow',
    'Friendly Static',
    'Open Kitchen',
    'Drifting Shelf',
    'Common Thread',
    'Quiet Broadcast',
    'Lantern Exchange',
    'Public Pillow',
    'Borrowed Window',
    'Daily Pebble',
    'Little Portal',
    'Warm Server',
    'Garden Hotline',
    'Last Light',
  ];
  const demoImages = [
    '/pixel-bunny.png',
    '/red-stool.png',
    '/demo/cat.jpg',
    '/demo/dog.png',
    '/persian-rug.png',
    '/images/do-not-turn-off.jpg',
    '/week-3/saint-frank-communal-table.png',
  ];
  const demoEmojis = ['🌱', '📻', '🌙', '📚', '🫧', '🪑', '☁️', '🍵'];
  const demoColors = [
    '#7a9574',
    '#c0373c',
    '#274b9e',
    '#e8a63a',
    '#9b6aa2',
    '#438a8f',
  ];
  const demoProjects = Array.from({ length: 30 }, (_, index) => ({
    id: `demo-${index + 1}`,
    name: demoNames[index],
    title: demoTitles[index],
    url: `https://example.com/place-${index + 1}`,
    emoji: demoEmojis[index % demoEmojis.length],
    imageUrl: new URL(demoImages[index % demoImages.length], SCRIPT_URL).href,
    accentColor: demoColors[index % demoColors.length],
    submittedAt: index + 1,
    demo: true,
  }));
  const starterProjects = [
    {
      id: 'builtin-class-site',
      name: 'Spencer Chang + Munus Shih',
      title: 'Building Benches for the Web',
      url: 'https://class.playhtml.fun/',
      emoji: '🪑',
      imageUrl: new URL('/red-stool.png', SCRIPT_URL).href,
      accentColor: '#e00000',
      submittedAt: -3,
    },
    {
      id: 'builtin-we-were-online',
      name: 'Spencer Chang',
      title: 'we were online',
      url: 'https://wewere.online/',
      emoji: '🌿',
      imageUrl: new URL('/we-were-online-icon.png', SCRIPT_URL).href,
      accentColor: '#806a52',
      submittedAt: -2,
    },
    {
      id: 'builtin-playhtml',
      name: 'Spencer Chang',
      title: 'PlayHTML',
      url: 'https://playhtml.fun/',
      emoji: '🌐',
      imageUrl: 'https://playhtml.fun/icon.png',
      accentColor: '#ffad42',
      submittedAt: -1,
    },
  ];

  function withStarterProjects(projects) {
    const projectsById = new Map(
      projects.map((project) => [project.id, project]),
    );
    const starterIds = new Set(starterProjects.map((project) => project.id));
    return [
      ...starterProjects.map(
        (project) => projectsById.get(project.id) ?? project,
      ),
      ...projects.filter(
        (project) =>
          !starterIds.has(project.id) && !project.id.startsWith('builtin-'),
      ),
    ];
  }

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

  function conventionalFaviconUrls(projectUrl) {
    try {
      const { origin } = new URL(projectUrl);
      return [
        '/favicon.ico',
        '/favicon.png',
        '/favicon.jpg',
        '/favicon.jpeg',
        '/favicon.gif',
        '/favicon.svg',
        '/apple-touch-icon.png',
        '/apple-touch-icon-precomposed.png',
      ].map((path) => new URL(path, origin).href);
    } catch {
      return [];
    }
  }

  function discoverDeclaredIconUrls(projectUrl) {
    if (declaredIconCache.has(projectUrl)) {
      return declaredIconCache.get(projectUrl);
    }

    const request = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 1800);

      try {
        const response = await fetch(projectUrl, {
          cache: 'force-cache',
          credentials: 'omit',
          headers: { Accept: 'text/html' },
          referrerPolicy: 'no-referrer',
          signal: controller.signal,
        });
        if (!response.ok) return [];

        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('text/html')) return [];

        const html = await response.text();
        const documentSnapshot = new DOMParser().parseFromString(
          html,
          'text/html',
        );

        return [...documentSnapshot.querySelectorAll('link[rel][href]')]
          .filter((link) =>
            link.rel
              .toLowerCase()
              .split(/\s+/)
              .some((token) => token === 'icon' || token.endsWith('-icon')),
          )
          .map((link) => {
            try {
              const iconUrl = new URL(link.getAttribute('href'), response.url);
              return iconUrl.protocol === 'http:' ||
                iconUrl.protocol === 'https:'
                ? iconUrl.href
                : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      } catch {
        return [];
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    declaredIconCache.set(projectUrl, request);
    return request;
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
            emoji: safeText(project.emoji, 12, '🌱'),
            faviconUrls: conventionalFaviconUrls(url),
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

  function makeLink(project, className) {
    const link = document.createElement('a');
    link.className = className;
    link.href = project.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function appendProjectImage(container, project, fallback) {
    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    container.append(image);
    image.addEventListener('load', () => {
      fallback.hidden = true;
    });

    const declaredIcons = project.demo
      ? Promise.resolve([])
      : discoverDeclaredIconUrls(project.url);

    void declaredIcons.then((declaredIconUrls) => {
      if (!image.isConnected) return;

      const imageSources = (
        project.demo
          ? [project.imageUrl]
          : project.id === 'builtin-we-were-online'
            ? [project.imageUrl]
            : [
                ...declaredIconUrls,
                ...(project.faviconUrls ?? []),
                project.imageUrl,
              ]
      ).filter(
        (source, index, sources) => source && sources.indexOf(source) === index,
      );
      let sourceIndex = 0;

      const loadNextSource = () => {
        const source = imageSources[sourceIndex];
        if (!source) {
          image.remove();
          return;
        }
        image.src = source;
      };

      image.addEventListener('error', () => {
        sourceIndex += 1;
        loadNextSource();
      });
      loadNextSource();
    });
  }

  function makeExpandableCircle(project, className) {
    const link = makeLink(project, className);
    link.style.setProperty('--ring-color', project.accentColor);
    link.setAttribute('aria-label', `${project.title} by ${project.name}`);

    const fallback = document.createElement('span');
    fallback.textContent = project.emoji;
    link.append(fallback);

    appendProjectImage(link, project, fallback);

    const tooltip = document.createElement('em');
    tooltip.textContent = project.title;
    link.append(tooltip);
    return link;
  }

  function shuffle(items) {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledItems[index], shuffledItems[randomIndex]] = [
        shuffledItems[randomIndex],
        shuffledItems[index],
      ];
    }

    return shuffledItems;
  }

  function compactElementPosition(slotIndex, slotCount) {
    const angle = (slotIndex / slotCount) * Math.PI * 2 - Math.PI / 2;
    return {
      left: `${50 + Math.cos(angle) * 38}%`,
      top: `${50 + Math.sin(angle) * 38}%`,
    };
  }

  function positionCompactElement(element, slotIndex, slotCount) {
    const position = compactElementPosition(slotIndex, slotCount);
    element.style.left = position.left;
    element.style.top = position.top;
  }

  function renderExpandable() {
    const projects = demoMode
      ? demoProjects
      : withStarterProjects(latestProjects);

    widget.replaceChildren();
    widget.className = `class-webring-widget class-webring-widget--expandable${
      expanded ? ' is-expanded' : ''
    }`;

    if (!expanded) {
      const miniature = document.createElement('div');
      miniature.className = 'class-webring-widget__miniature';
      const miniOrbit = document.createElement('div');
      miniOrbit.className = 'class-webring-widget__mini-orbit';
      miniOrbit.style.setProperty(
        '--class-webring-orbit-duration',
        demoMode ? '8s' : '45s',
      );
      const randomizedProjects = shuffle(projects);
      const compactProjects = randomizedProjects.slice(
        0,
        maximumCompactProjects,
      );
      const waitingProjects = randomizedProjects.slice(maximumCompactProjects);
      const hasProjectPool = waitingProjects.length > 0;
      const slotCount = compactProjects.length + (hasProjectPool ? 1 : 0);
      const poolSlotIndex = hasProjectPool ? Math.floor(slotCount / 2) : -1;
      const projectSlotIndexes = Array.from(
        { length: slotCount },
        (_, index) => index,
      ).filter((index) => index !== poolSlotIndex);
      const departingSlotIndex = (poolSlotIndex - 1 + slotCount) % slotCount;
      const arrivingSlotIndex = (poolSlotIndex + 1) % slotCount;
      const departingProjectIndex =
        projectSlotIndexes.indexOf(departingSlotIndex);
      const arrivingProjectIndex =
        projectSlotIndexes.indexOf(arrivingSlotIndex);
      const compactCircles = [];

      compactProjects.forEach((project, index) => {
        const circle = makeExpandableCircle(
          project,
          'class-webring-widget__circle class-webring-widget__circle--mini',
        );
        positionCompactElement(circle, projectSlotIndexes[index], slotCount);
        miniOrbit.append(circle);
        compactCircles.push(circle);
      });

      let projectPool = null;
      if (hasProjectPool) {
        projectPool = document.createElement('div');
        projectPool.className = 'class-webring-widget__pool';
        projectPool.setAttribute('role', 'status');
        projectPool.setAttribute(
          'aria-label',
          `${waitingProjects.length} other project links`,
        );

        const poolCount = document.createElement('strong');
        poolCount.textContent = `+${waitingProjects.length}`;
        const poolLabel = document.createElement('span');
        poolLabel.textContent = 'others';
        projectPool.append(poolCount, poolLabel);
        positionCompactElement(projectPool, poolSlotIndex, slotCount);
        miniOrbit.append(projectPool);
      }

      let swappingProject = false;
      async function swapCompactProject() {
        if (swappingProject || waitingProjects.length === 0 || !projectPool)
          return;

        swappingProject = true;
        miniOrbit.classList.add('is-swapping');

        const arrivingProject = waitingProjects.shift();
        if (
          departingProjectIndex < 0 ||
          arrivingProjectIndex < 0 ||
          !arrivingProject
        ) {
          miniOrbit.classList.remove('is-swapping');
          swappingProject = false;
          return;
        }

        const departingProject = compactProjects[departingProjectIndex];
        const departingCircle = compactCircles[departingProjectIndex];
        const poolPosition = compactElementPosition(poolSlotIndex, slotCount);
        projectPool.classList.add('is-receiving');

        const departure = departingCircle.animate(
          [
            {
              left: departingCircle.style.left,
              opacity: 1,
              top: departingCircle.style.top,
            },
            {
              left: poolPosition.left,
              opacity: 0,
              top: poolPosition.top,
            },
          ],
          {
            duration: 460,
            easing: 'cubic-bezier(.55, 0, .8, .35)',
            fill: 'forwards',
          },
        );
        await departure.finished.catch(() => undefined);
        departingCircle.remove();

        const nextCompactProjects = Array(compactProjects.length);
        const nextCompactCircles = Array(compactCircles.length);
        const advances = compactCircles.flatMap((circle, index) => {
          if (index === departingProjectIndex) return [];

          const currentSlotIndex = projectSlotIndexes[index];
          const nextSlotIndex = (currentSlotIndex + 1) % slotCount;
          const nextProjectIndex = projectSlotIndexes.indexOf(nextSlotIndex);
          const nextPosition = compactElementPosition(nextSlotIndex, slotCount);
          const distanceToGap =
            (departingSlotIndex - currentSlotIndex + slotCount) % slotCount;
          const advance = circle.animate(
            [
              { left: circle.style.left, top: circle.style.top },
              { left: nextPosition.left, top: nextPosition.top },
            ],
            {
              delay: Math.max(0, distanceToGap - 1) * 55,
              duration: 480,
              easing: 'cubic-bezier(.22, .7, .25, 1)',
            },
          );

          circle.style.left = nextPosition.left;
          circle.style.top = nextPosition.top;
          nextCompactProjects[nextProjectIndex] = compactProjects[index];
          nextCompactCircles[nextProjectIndex] = circle;
          return advance.finished.catch(() => undefined);
        });
        await Promise.all(advances);

        const arrivingCircle = makeExpandableCircle(
          arrivingProject,
          'class-webring-widget__circle class-webring-widget__circle--mini',
        );
        positionCompactElement(arrivingCircle, poolSlotIndex, slotCount);
        arrivingCircle.style.opacity = '0';
        miniOrbit.append(arrivingCircle);
        const arrivingPosition = compactElementPosition(
          arrivingSlotIndex,
          slotCount,
        );
        const arrival = arrivingCircle.animate(
          [
            {
              left: poolPosition.left,
              opacity: 0,
              top: poolPosition.top,
            },
            {
              left: arrivingPosition.left,
              opacity: 1,
              top: arrivingPosition.top,
            },
          ],
          {
            duration: 520,
            easing: 'cubic-bezier(.18, .7, .22, 1)',
          },
        );
        arrivingCircle.style.left = arrivingPosition.left;
        arrivingCircle.style.opacity = '1';
        arrivingCircle.style.top = arrivingPosition.top;
        await arrival.finished.catch(() => undefined);

        nextCompactProjects[arrivingProjectIndex] = arrivingProject;
        nextCompactCircles[arrivingProjectIndex] = arrivingCircle;
        compactProjects.splice(
          0,
          compactProjects.length,
          ...nextCompactProjects,
        );
        compactCircles.splice(0, compactCircles.length, ...nextCompactCircles);
        waitingProjects.push(departingProject);

        projectPool.classList.remove('is-receiving');
        miniOrbit.classList.remove('is-swapping');
        swappingProject = false;
      }

      miniOrbit.addEventListener('animationiteration', (event) => {
        if (event.target !== miniOrbit) return;
        void swapCompactProject();
      });

      const toggle = document.createElement('button');
      toggle.className = 'class-webring-widget__toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = label;
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

    const frame = document.createElement('iframe');
    frame.className = 'class-webring-widget__frame';
    frame.src = playgroundUrl.href;
    frame.title = label;
    frame.allow = 'clipboard-write';
    panel.append(frame, close);
    widget.append(panel);
  }

  function updateProjects(data, source) {
    latestProjects = sanitizeProjects(data);
    renderExpandable();

    const projectCount = demoMode
      ? demoProjects.length
      : withStarterProjects(latestProjects).length;
    widget.dataset.projectCount = String(projectCount);
    window.dispatchEvent(
      new CustomEvent('class-webring:update', {
        detail: { projectCount },
      }),
    );
    if (debugMode) {
      console.info('[class-webring] registry updated', {
        dataSource,
        projectCount,
        source,
      });
    }
  }

  const style = document.createElement('style');
  style.dataset.classWebringStyle = '';
  style.textContent = `
    @font-face {
      font-family: 'Healing the Web A';
      src: url('${DISPLAY_FONT_URL}') format('opentype');
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }
    .class-webring-widget {
      z-index: 2147483000;
    }
    html.class-webring-embed-hidden .class-webring-widget {
      display: none !important;
    }
    .class-webring-widget *,
    .class-webring-widget *::before,
    .class-webring-widget *::after { box-sizing: border-box; }
    .class-webring-widget--expandable {
      bottom: .65rem;
      color: #382c28;
      font-family: 'Healing the Web A', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      position: fixed;
      right: .65rem;
    }
    .class-webring-widget__miniature {
      height: 14rem;
      position: relative;
      width: 14rem;
    }
    .class-webring-widget__mini-orbit {
      animation: class-webring-spin var(--class-webring-orbit-duration) linear infinite;
      inset: 0;
      position: absolute;
    }
    .class-webring-widget__toggle {
      background: transparent;
      border: 0;
      color: currentColor;
      cursor: pointer;
      font-family: inherit;
      font-size: .8rem;
      font-style: italic;
      line-height: 1.1;
      left: 50%;
      padding: .5rem;
      position: absolute;
      text-align: center;
      text-decoration: none;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 5.5rem;
    }
    .class-webring-widget--expandable.is-expanded {
      inset: 0;
      position: fixed;
    }
    .class-webring-widget__world {
      animation: class-webring-in .3s ease-out;
      background: #f8efe3;
      height: 100%;
      overflow: hidden;
      position: relative;
      width: 100%;
    }
    .class-webring-widget__frame {
      border: 0;
      display: block;
      height: 100%;
      inset: 0;
      position: absolute;
      width: 100%;
    }
    .class-webring-widget__close {
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(224,0,0,.25);
      border-radius: 50%;
      color: #e00000;
      cursor: pointer;
      font-family: inherit;
      font-size: 2.2rem;
      font-weight: 400;
      height: 2.8rem;
      line-height: 1;
      position: absolute;
      right: 1.2rem;
      top: 1rem;
      width: 2.8rem;
      z-index: 5;
    }
    .class-webring-widget__circle {
      align-items: center;
      color: #222;
      display: flex;
      filter: drop-shadow(0 .18rem .28rem rgba(56,44,40,.14))
        drop-shadow(0 0 .35rem color-mix(in srgb, var(--ring-color) 22%, transparent));
      justify-content: center;
      position: absolute;
      text-decoration: none;
    }
    .class-webring-widget__circle--mini {
      animation: class-webring-counter-spin var(--class-webring-orbit-duration) linear infinite;
      font-size: 1rem;
      height: 2.65rem;
      margin: -1.325rem 0 0 -1.325rem;
      width: 2.65rem;
    }
    .class-webring-widget__pool {
      align-items: center;
      animation: class-webring-counter-spin var(--class-webring-orbit-duration) linear infinite;
      background: rgba(255,255,255,.9);
      border: 2px dashed rgba(224,0,0,.55);
      border-radius: 50%;
      box-shadow: 0 0 1rem rgba(224,0,0,.14);
      color: #e00000;
      display: flex;
      flex-direction: column;
      height: 2.85rem;
      justify-content: center;
      margin: -1.425rem 0 0 -1.425rem;
      pointer-events: none;
      position: absolute;
      width: 2.85rem;
    }
    .class-webring-widget__pool strong {
      font-size: .78rem;
      font-weight: 400;
      line-height: .8;
    }
    .class-webring-widget__pool span {
      font-size: .46rem;
      letter-spacing: .06em;
      line-height: 1;
      margin-top: .28rem;
      text-transform: uppercase;
    }
    .class-webring-widget__mini-orbit.is-swapping,
    .class-webring-widget__mini-orbit.is-swapping .class-webring-widget__circle--mini {
      animation-play-state: paused;
    }
    .class-webring-widget__pool.is-receiving {
      animation: class-webring-pool-pulse 1.8s ease-in-out both;
    }
    .class-webring-widget__circle img {
      height: 100%;
      inset: 0;
      object-fit: contain;
      position: absolute;
      width: 100%;
    }
    .class-webring-widget__circle em {
      background: rgba(255,255,255,.92);
      border-radius: 999px;
      bottom: -.5rem;
      color: #5d423b;
      font-family: inherit;
      font-size: .6rem;
      line-height: 1;
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
    @keyframes class-webring-in {
      from { opacity: 0; transform: scale(.98); }
    }
    @keyframes class-webring-spin { to { transform: rotate(360deg); } }
    @keyframes class-webring-counter-spin { to { transform: rotate(-360deg); } }
    @keyframes class-webring-pool-pulse {
      0%, 100% { box-shadow: 0 0 1rem rgba(224,0,0,.14); transform: scale(1); }
      48% { box-shadow: 0 0 1.8rem .45rem rgba(224,0,0,.34); transform: scale(1.18); }
    }
    @media (max-width: 520px) {
      .class-webring-widget__miniature { height: 12.5rem; width: 12.5rem; }
      .class-webring-widget__circle--mini {
        height: 2.35rem;
        margin: -1.175rem 0 0 -1.175rem;
        width: 2.35rem;
      }
      .class-webring-widget__pool {
        height: 2.55rem;
        margin: -1.275rem 0 0 -1.275rem;
        width: 2.55rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
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

  function disconnectRemoteRegistry() {
    if (widget.hasAttribute('can-play')) {
      playhtml?.removePlayElement(widget);
    }

    widget.removeAttribute('can-play');
    widget.removeAttribute('data-source');
    widget.removeAttribute('data-source-read-only');
  }

  function prepareRemoteRegistry() {
    widget.setAttribute('can-play', '');
    widget.setAttribute('data-source', dataSource);
    widget.setAttribute('data-source-read-only', '');
    widget.defaultData = { projects: {} };
    widget.updateElement = ({ data }) => updateProjects(data, 'PlayHTML');
  }

  async function connectRemoteRegistry() {
    prepareRemoteRegistry();

    if (!playhtml) {
      const importedModule = await import('https://unpkg.com/playhtml');
      playhtml = window.playhtml ?? importedModule.playhtml;
    }

    if (playhtml.roomId) {
      playhtml.setupPlayElement(widget);
    } else {
      await playhtml.init();
    }
  }

  const handleRegistryMode = (event) => {
    const nextMode = event.detail?.mode;
    if (
      nextMode !== 'disabled' &&
      nextMode !== 'local' &&
      nextMode !== 'remote'
    ) {
      return;
    }
    if (nextMode === registryMode) return;

    registryMode = nextMode;
    if (registryMode === 'remote') {
      void connectRemoteRegistry();
      return;
    }

    disconnectRemoteRegistry();
    if (registryMode === 'local') {
      window.dispatchEvent(new Event(registryDataRequestEvent));
    }
  };
  window.addEventListener(registryModeEvent, handleRegistryMode);

  if (registryMode === 'remote') {
    prepareRemoteRegistry();
  }

  document.head.append(style);
  document.body.append(widget);
  widget.dataset.projectCount = String(
    demoMode ? demoProjects.length : starterProjects.length,
  );
  renderExpandable();

  if (registryMode === 'local') {
    window.dispatchEvent(new Event(registryDataRequestEvent));
  } else {
    await connectRemoteRegistry();
  }
}

// ABOUTME: Hidden teaching route that simulates an independent personal site.
// ABOUTME: Its iframe loads the same public webring embed participants will use.

import { getClassWebringScriptUrl } from '../lib/classWebringScript';

type WebringVariant = 'expandable' | 'peek';

function demoDocument(scriptUrl: string, variant: WebringVariant): string {
  const startExpanded = variant === 'expandable' ? ' data-expanded="true"' : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moss House</title>
    <style>
      * { box-sizing: border-box; }
      body {
        background: #d8dfbf;
        color: #25402e;
        font-family: Georgia, serif;
        margin: 0;
        min-height: 100vh;
        padding: clamp(2rem, 7vw, 7rem);
      }
      main { max-width: 42rem; }
      .eyebrow { font: 700 .75rem/1 Arial, sans-serif; letter-spacing: .15em; text-transform: uppercase; }
      h1 { font-size: clamp(4rem, 13vw, 9rem); font-weight: 400; letter-spacing: -.06em; line-height: .75; margin: 1rem 0 2rem; }
      p { font-size: clamp(1.1rem, 2vw, 1.5rem); line-height: 1.55; max-width: 34rem; }
      .moss { display: flex; flex-wrap: wrap; font-size: 3rem; gap: 1rem; margin-top: 3rem; }
      .moss span { animation: breathe 4s ease-in-out infinite alternate; }
      .moss span:nth-child(2) { animation-delay: -1s; }
      .moss span:nth-child(3) { animation-delay: -2s; }
      @keyframes breathe { to { transform: translateY(-.5rem) rotate(5deg); } }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow">A pretend student website</div>
      <h1>Moss<br />House</h1>
      <p>
        This page has its own type, colors, layout, and personality. The class
        web ring arrives through one external module script and stays visually
        separate from the page.
      </p>
      <div class="moss" aria-label="A row of mossy things">
        <span>🪨</span><span>🌿</span><span>🍄</span>
      </div>
    </main>
    <script type="module" src="${scriptUrl}" data-demo="true" data-variant="${variant}"${startExpanded}></script>
  </body>
</html>`;
}

export default function WebringDemo() {
  const scriptUrl = getClassWebringScriptUrl();
  const demos: Array<{
    description: string;
    label: string;
    variant: WebringVariant;
  }> = [
    {
      description:
        'The familiar button opens the large image field. Its title is “Benches for the Internet,” without a project count.',
      label: 'Option 1 · Expandable',
      variant: 'expandable',
    },
    {
      description:
        'A small piece waits beyond the bottom-right corner. Hover or tab into it and the whole orbit spins into view.',
      label: 'Option 2 · Corner peek',
      variant: 'peek',
    },
  ];

  return (
    <main className="webring-demo-page">
      <header className="webring-demo-page__header">
        <div>
          <p>Hidden preview</p>
          <h1>Web-ring embed on another site</h1>
        </div>
        <a href="/showcase">Back to Showcase</a>
      </header>

      <section className="webring-demo-page__options">
        {demos.map((demo) => {
          const snippet = `<script type="module" src="${scriptUrl}" data-variant="${demo.variant}"></script>`;

          return (
            <article className="webring-demo-page__option" key={demo.variant}>
              <div className="webring-demo-page__instructions">
                <div>
                  <h2>{demo.label}</h2>
                  <p>{demo.description}</p>
                </div>
                <code>{snippet}</code>
              </div>
              <iframe
                className="webring-demo-page__frame"
                title={`${demo.label} on an independent website`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                srcDoc={demoDocument(scriptUrl, demo.variant)}
              />
            </article>
          );
        })}
      </section>
    </main>
  );
}

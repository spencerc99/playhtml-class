// ABOUTME: Fixed single-row text navigation for internal pages and external links.
// ABOUTME: Uses the site's display typeface and an adjustable gap between items.

import { Link, useLocation } from 'react-router';

interface NavItem {
  to: string;
  label: string;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Home',
  },
  {
    to: '/showcase',
    label: 'Showcase',
  },
  {
    to: 'https://playhtml.fun/docs',
    label: 'Docs',
    external: true,
  },
  {
    to: 'https://playhtml.fun',
    label: 'playhtml.fun',
    external: true,
  },
];

const NAV_GAP_CLASS = 'gap-5 md:gap-8';
const NAV_TEXT_STYLE = {
  fontFamily: 'var(--font-display)',
  fontFeatureSettings:
    "'liga' 1, 'ss01' 1, 'ss02' 1, 'ss03' 1, 'ss04' 1, 'ss05' 1, 'ss06' 1",
} as const;

export default function Nav() {
  const location = useLocation();

  return (
    <nav
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center whitespace-nowrap ${NAV_GAP_CLASS}`}
      style={{
        ...NAV_TEXT_STYLE,
        filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.08))',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.external
          ? false
          : item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

        const sharedProps = {
          className:
            'bg-white px-4 py-3 text-lg uppercase leading-none no-underline transition duration-200 hover:-translate-y-1 hover:no-underline md:px-5 md:text-xl',
          style: {
            background: isActive ? '#e00000' : '#ffffff',
            color: isActive ? '#ffffff' : '#e00000',
          },
        } as const;

        if (item.external) {
          return (
            <a
              key={item.to}
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.label} (opens in new tab)`}
              {...sharedProps}
            >
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.to} to={item.to} {...sharedProps}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

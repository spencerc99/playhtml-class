// ABOUTME: Fixed navigation widget styled as physical objects on a shelf.
// ABOUTME: Persistent nav items for internal pages and external playhtml links.

import { useState, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router';

interface NavItem {
  to: string;
  label: string;
  icon: ReactElement;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Home',
    icon: (
      // Bench / door shape
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
        <rect
          x="4"
          y="6"
          width="24"
          height="18"
          rx="2"
          stroke="#e00000"
          strokeWidth="2.5"
          fill="none"
        />
        <line x1="16" y1="6" x2="16" y2="24" stroke="#e00000" strokeWidth="2" />
        <circle cx="20" cy="15" r="1.5" fill="#e00000" />
        <line
          x1="4"
          y1="24"
          x2="4"
          y2="29"
          stroke="#e00000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="24"
          x2="28"
          y2="29"
          stroke="#e00000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/showcase',
    label: 'Showcase',
    icon: (
      // Bulletin board / picture frame with pins
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
        <rect
          x="3"
          y="5"
          width="26"
          height="22"
          rx="1"
          stroke="#e00000"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="7"
          y="9"
          width="8"
          height="6"
          rx="0.5"
          stroke="#e00000"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="18"
          y="9"
          width="7"
          height="4"
          rx="0.5"
          stroke="#e00000"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="7"
          y="18"
          width="5"
          height="5"
          rx="0.5"
          stroke="#e00000"
          strokeWidth="1.5"
          fill="none"
        />
        <line
          x1="18"
          y1="16"
          x2="25"
          y2="16"
          stroke="#e00000"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="19"
          x2="23"
          y2="19"
          stroke="#e00000"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="22"
          x2="25"
          y2="22"
          stroke="#e00000"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="11" cy="9" r="1.5" fill="#e00000" />
        <circle cx="21" cy="5" r="1.5" fill="#e00000" />
      </svg>
    ),
  },
  {
    to: 'https://playhtml.fun/docs',
    label: 'Docs',
    external: true,
    icon: (
      // Open book / docs icon
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
        <path
          d="M5 7.5c0-1.4 1.1-2.5 2.5-2.5h6.3c1.2 0 2.3.5 3.2 1.3V26c-.8-.7-1.8-1-2.9-1H7.5A2.5 2.5 0 0 1 5 22.5z"
          stroke="#e00000"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M27 7.5c0-1.4-1.1-2.5-2.5-2.5h-6.3c-1.2 0-2.3.5-3.2 1.3V26c.8-.7 1.8-1 2.9-1h6.6a2.5 2.5 0 0 0 2.5-2.5z"
          stroke="#e00000"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <line
          x1="8"
          y1="10"
          x2="13.5"
          y2="10"
          stroke="#e00000"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="8"
          y1="14"
          x2="13.5"
          y2="14"
          stroke="#e00000"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="18.5"
          y1="10"
          x2="24"
          y2="10"
          stroke="#e00000"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="18.5"
          y1="14"
          x2="24"
          y2="14"
          stroke="#e00000"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: 'https://playhtml.fun',
    label: 'playhtml.fun',
    external: true,
    icon: (
      // Orbit / playful web icon
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
        <circle cx="16" cy="16" r="4.5" stroke="#e00000" strokeWidth="2.2" />
        <ellipse
          cx="16"
          cy="16"
          rx="11"
          ry="4.8"
          stroke="#e00000"
          strokeWidth="2"
          transform="rotate(-20 16 16)"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="11"
          ry="4.8"
          stroke="#e00000"
          strokeWidth="2"
          transform="rotate(20 16 16)"
        />
        <circle cx="24.7" cy="11.9" r="1.8" fill="#e00000" />
      </svg>
    ),
  },
];

export default function Nav() {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav
      className="fixed bottom-0 right-4 z-50 flex items-end gap-1 pb-1"
      style={{ filter: 'drop-shadow(0 -2px 8px rgba(0,0,0,0.08))' }}
    >
      {NAV_ITEMS.map((item, i) => {
        const isActive = item.external
          ? false
          : item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
        const isHovered = hoveredIndex === i;

        const card = (
          <>
            {/* Card body */}
            <div
              className="flex flex-col items-center rounded-t-lg px-3 pb-1 pt-2"
              style={{
                background: isActive
                  ? 'rgba(224,0,0,0.06)'
                  : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                transition: 'background 0.2s',
              }}
            >
              <div className="mb-0.5 h-7 w-7">{item.icon}</div>
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{
                  color: isActive ? '#e00000' : 'rgba(224,0,0,0.6)',
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </span>
            </div>
          </>
        );

        const sharedProps = {
          onMouseEnter: () => setHoveredIndex(i),
          onMouseLeave: () => setHoveredIndex(null),
          className: 'group relative flex flex-col items-center no-underline',
          style: {
            transform: isHovered
              ? 'translateY(-6px)'
              : isActive
                ? 'translateY(-3px)'
                : 'translateY(0)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
              {card}
            </a>
          );
        }

        return (
          <Link key={item.to} to={item.to} {...sharedProps}>
            {card}
          </Link>
        );
      })}
    </nav>
  );
}

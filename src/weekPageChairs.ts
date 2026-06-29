// ABOUTME: Shared stool layout for week pages. Rendered on the page stage
// ABOUTME: (not inside article content) so can-move positions stay consistent.

import type { FloatingChairProps } from './components/FloatingChair';

export const WEEK_PAGE_CHAIRS: FloatingChairProps[] = [
  { id: 'chair-1', className: 'left-[2%] top-[14rem]', canMoveBounds: 'week-stage' },
  { id: 'chair-2', className: 'right-[2%] top-[18rem]', canMoveBounds: 'week-stage' },
  { id: 'chair-3', className: 'left-[4%] top-[32rem]', canMoveBounds: 'week-stage' },
  { id: 'chair-4', className: 'right-[4%] top-[38rem]', canMoveBounds: 'week-stage' },
];

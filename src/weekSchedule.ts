// ABOUTME: Computes when each class week unlocks on the home page, starting
// ABOUTME: from the first day of class so students can't jump ahead.

const FIRST_CLASS_DAY = new Date('2026-06-22T00:00:00');
const DAYS_PER_WEEK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Week 0 is always open; each later week unlocks one week after the previous.
export function weekUnlockDate(weekNumber: number): Date | null {
  if (weekNumber <= 0) {
    return null;
  }

  return new Date(
    FIRST_CLASS_DAY.getTime() + (weekNumber - 1) * DAYS_PER_WEEK * MS_PER_DAY,
  );
}

export function isWeekUnlocked(
  weekNumber: number,
  now: Date = new Date(),
): boolean {
  const unlockDate = weekUnlockDate(weekNumber);
  return unlockDate === null || now >= unlockDate;
}

export function formatUnlockDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

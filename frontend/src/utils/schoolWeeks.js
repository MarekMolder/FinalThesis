/**
 * Compute school weeks from a school year start date and holiday breaks.
 *
 * @param {string} startDateStr - School year start date, e.g. "2025-09-01"
 * @param {Array<{startDate: string, endDate: string}>} breaks - Holiday periods
 * @returns {Array<{weekNumber: number, startDate: Date, endDate: Date, isHoliday: boolean}>}
 */
export function computeSchoolWeeks(startDateStr, breaks = []) {
  if (!startDateStr) return [];

  // Handle both "2025-09-01" string and [2025, 9, 1] array formats (Jackson without JavaTimeModule)
  let dateStr = startDateStr;
  if (Array.isArray(startDateStr)) {
    const [y, m, d] = startDateStr;
    dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const startDate = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(startDate.getTime())) return [];

  // Find the Monday of the week containing startDate
  const startDay = startDate.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
  const firstMonday = new Date(startDate);
  firstMonday.setDate(firstMonday.getDate() + mondayOffset);

  // Parse breaks into date ranges
  const breakRanges = breaks
    .map((b) => ({
      start: new Date(b.startDate + 'T00:00:00'),
      end: new Date(b.endDate + 'T23:59:59'),
    }))
    .filter((b) => !Number.isNaN(b.start.getTime()) && !Number.isNaN(b.end.getTime()));

  // Find the last break end (summer) to know when to stop
  const lastBreakEnd = breakRanges.reduce(
    (max, b) => (b.end > max ? b.end : max),
    new Date(startDate.getFullYear() + 1, 7, 31) // default: Aug 31 next year
  );

  const weeks = [];
  let weekNumber = 0;
  let currentMonday = new Date(firstMonday);

  while (currentMonday <= lastBreakEnd) {
    const friday = new Date(currentMonday);
    friday.setDate(friday.getDate() + 4);

    // Check if this week overlaps with any break
    const isHoliday = breakRanges.some(
      (b) => currentMonday <= b.end && friday >= b.start
    );

    if (!isHoliday) {
      weekNumber++;
    }

    weeks.push({
      weekNumber: isHoliday ? null : weekNumber,
      startDate: new Date(currentMonday),
      endDate: new Date(friday),
      isHoliday,
    });

    // Move to next Monday
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  return weeks;
}

/**
 * Find which school week a given date falls into.
 * @param {Date} date
 * @param {Array} schoolWeeks - result of computeSchoolWeeks
 * @returns {{weekNumber: number, startDate: Date, endDate: Date, isHoliday: boolean} | null}
 */
export function findSchoolWeek(date, schoolWeeks) {
  if (!date || !schoolWeeks?.length) return null;
  const t = date.getTime();
  return schoolWeeks.find(
    (w) => t >= w.startDate.getTime() && t <= w.endDate.getTime() + 86400000 - 1
  ) || null;
}

/**
 * Format a school week label.
 * @param {{weekNumber: number, startDate: Date, endDate: Date}} week
 * @returns {string} e.g. "3. oppenadal (15.--19. sept)"
 */
export function formatSchoolWeekLabel(week) {
  if (!week || week.weekNumber == null) return null;

  const MONTHS_SHORT = ['jaan', 'veebr', 'marts', 'apr', 'mai', 'juuni', 'juuli', 'aug', 'sept', 'okt', 'nov', 'dets'];

  const sd = week.startDate;
  const ed = week.endDate;
  const sDay = sd.getDate();
  const eDay = ed.getDate();
  const sMonth = sd.getMonth();
  const eMonth = ed.getMonth();

  if (sMonth === eMonth) {
    return `${week.weekNumber}. \u00f5ppen\u00e4dal (${sDay}.\u2013${eDay}. ${MONTHS_SHORT[sMonth]})`;
  }
  return `${week.weekNumber}. \u00f5ppen\u00e4dal (${sDay}. ${MONTHS_SHORT[sMonth]} \u2013 ${eDay}. ${MONTHS_SHORT[eMonth]})`;
}

/**
 * Find all school weeks that overlap with a date range.
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {Array} schoolWeeks - result of computeSchoolWeeks
 * @returns {Array} matching non-holiday weeks
 */
export function findSchoolWeeksInRange(startDate, endDate, schoolWeeks) {
  if (!startDate || !schoolWeeks?.length) return [];
  const end = endDate || startDate;
  const startMs = startDate.getTime();
  const endMs = end.getTime() + 86400000 - 1;
  return schoolWeeks.filter(
    (w) => w.weekNumber != null && w.endDate.getTime() + 86400000 - 1 >= startMs && w.startDate.getTime() <= endMs
  );
}

/** Default school breaks for known school years. */
export const DEFAULT_SCHOOL_BREAKS = {
  '2025': [
    { startDate: '2025-10-20', endDate: '2025-10-26' },
    { startDate: '2025-12-22', endDate: '2026-01-04' },
    { startDate: '2026-02-23', endDate: '2026-03-01' },
    { startDate: '2026-04-13', endDate: '2026-04-19' },
    { startDate: '2026-06-10', endDate: '2026-08-31' },
  ],
};

/**
 * Get default breaks for a school year start date.
 * @param {string} startDateStr e.g. "2025-09-01"
 * @returns {Array<{startDate: string, endDate: string}>}
 */
export function getDefaultBreaks(startDateStr) {
  if (!startDateStr) return [];
  const year = startDateStr.slice(0, 4);
  return DEFAULT_SCHOOL_BREAKS[year] || [];
}

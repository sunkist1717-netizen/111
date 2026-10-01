import { WeekInfo } from '../types/report';

/**
 * Returns the Monday date for a given date
 */
export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD to Date object in local time
 */
export function parseDate(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculates Week Info for a specific date (Monday ~ Friday)
 * Determines month based on Thursday (ISO 8601 standard)
 */
export function getWeekInfoForDate(inputDate: Date): WeekInfo {
  const monday = getMonday(inputDate);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  // Thursday determines which month the week belongs to
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);

  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1;

  // Calculate Nth week of that month:
  // Find the first Thursday of that month
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const firstMonday = getMonday(firstDayOfMonth);
  const firstThursday = new Date(firstMonday);
  firstThursday.setDate(firstMonday.getDate() + 3);

  // If first Thursday is still in previous month, the first week starts on next Monday
  let startFirstWeekMonday = firstMonday;
  if (firstThursday.getMonth() + 1 !== month) {
    startFirstWeekMonday = new Date(firstMonday);
    startFirstWeekMonday.setDate(firstMonday.getDate() + 7);
  }

  const diffTime = monday.getTime() - startFirstWeekMonday.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
  const weekNumber = Math.max(1, diffWeeks + 1);

  // Week ID format: YYYY-MM-W{N}
  const id = `${year}-${String(month).padStart(2, '0')}-W${weekNumber}`;
  const label = `${year}년 ${month}월 ${weekNumber}주차`;
  const shortLabel = `${month}월 ${weekNumber}주차`;

  return {
    id,
    year,
    month,
    weekNumber,
    label,
    shortLabel,
    startDate: formatDate(monday),
    endDate: formatDate(friday),
  };
}

/**
 * Returns the Current Week Info based on today (or specified reference date)
 */
export function getCurrentWeekInfo(referenceDate: Date = new Date()): WeekInfo {
  return getWeekInfoForDate(referenceDate);
}

/**
 * Shifts week by delta (-1 for previous, +1 for next)
 */
export function shiftWeek(currentWeek: WeekInfo, delta: number): WeekInfo {
  const monday = parseDate(currentWeek.startDate);
  monday.setDate(monday.getDate() + delta * 7);
  return getWeekInfoForDate(monday);
}

/**
 * Returns all weeks that belong to a specific Year and Month
 */
export function getWeeksForMonth(year: number, month: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const seenIds = new Set<string>();

  // Check each day of the month
  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day += 3) {
    const d = new Date(year, month - 1, day);
    const info = getWeekInfoForDate(d);
    if (info.year === year && info.month === month && !seenIds.has(info.id)) {
      seenIds.add(info.id);
      weeks.push(info);
    }
  }

  // Sort by startDate
  weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return weeks;
}

/**
 * Formats date range: "2026.09.28 ~ 2026.10.02" or "(09.28 ~ 10.02)"
 */
export function formatDateRange(startDateStr: string, endDateStr: string, short = false): string {
  if (!startDateStr || !endDateStr) return '';
  const s = startDateStr.replace(/-/g, '.');
  const e = endDateStr.replace(/-/g, '.');
  if (short) {
    return `${s.slice(5)} ~ ${e.slice(5)}`;
  }
  return `${s} ~ ${e}`;
}

/**
 * Get available months around current time (e.g., current year months)
 */
export function getAvailableMonths(year: number = new Date().getFullYear()): Array<{ id: string; label: string; year: number; month: number }> {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push({
      id: `${year}-${String(m).padStart(2, '0')}`,
      label: `${year}년 ${m}월`,
      year,
      month: m,
    });
  }
  return months;
}

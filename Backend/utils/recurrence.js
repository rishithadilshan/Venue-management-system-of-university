const { normalizeDate } = require("./conflictDetection");

/**
 * Given a start date and a target dayOfWeek (0-6), returns the first
 * occurrence of that weekday on or after startDate.
 */
function firstOccurrence(startDate, dayOfWeek) {
  const start = normalizeDate(startDate);
  const diff = (dayOfWeek - start.getUTCDay() + 7) % 7;
  start.setUTCDate(start.getUTCDate() + diff);
  return start;
}

/**
 * Builds an array of Date objects, one per week, from firstOccurrence
 * through endDate (inclusive).
 */
function weeklyDates(startDate, endDate, dayOfWeek) {
  const dates = [];
  let current = firstOccurrence(startDate, dayOfWeek);
  const end = normalizeDate(endDate);
  while (current <= end) {
    dates.push(new Date(current));
    current = new Date(current);
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return dates;
}

module.exports = { firstOccurrence, weeklyDates };

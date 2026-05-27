export const OPERATIONAL_DAY_START_HOUR = 10;
export const OPERATIONAL_DAY_START_MINUTES = OPERATIONAL_DAY_START_HOUR * 60;

export const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function timeToMinutes(time) {
  if (!time) return 0;
  const [rawHour = '0', rawMinute = '0'] = String(time).split(':');
  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return Math.max(0, Math.min(23, hour)) * 60 + Math.max(0, Math.min(59, minute));
}

export function isNextMorning(time) {
  return timeToMinutes(time) < OPERATIONAL_DAY_START_MINUTES;
}

export function operationalSortValue(time) {
  const minutes = timeToMinutes(time);
  return minutes < OPERATIONAL_DAY_START_MINUTES ? minutes + 24 * 60 : minutes;
}

export function previousWeekday(dayKey) {
  const index = WEEKDAY_KEYS.indexOf(dayKey);
  if (index < 0) return dayKey;
  return WEEKDAY_KEYS[(index + WEEKDAY_KEYS.length - 1) % WEEKDAY_KEYS.length];
}

export function nextWeekday(dayKey) {
  const index = WEEKDAY_KEYS.indexOf(dayKey);
  if (index < 0) return dayKey;
  return WEEKDAY_KEYS[(index + 1) % WEEKDAY_KEYS.length];
}

export function operationalDayForScheduledDay(dayKey, time) {
  return isNextMorning(time) ? previousWeekday(dayKey) : dayKey;
}

export function scheduledDayForOperationalDay(dayKey, time) {
  return isNextMorning(time) ? nextWeekday(dayKey) : dayKey;
}

export function operationalTodayIndex(now = new Date()) {
  const day = now.getDay();
  const mondayIndex = day === 0 ? 6 : day - 1;
  return now.getHours() < OPERATIONAL_DAY_START_HOUR
    ? (mondayIndex + WEEKDAY_KEYS.length - 1) % WEEKDAY_KEYS.length
    : mondayIndex;
}

export function orderedOperationalHours(showEmpty, activeHours = []) {
  const all = Array.from({ length: 24 }, (_, hour) => hour);
  const source = showEmpty ? all : activeHours;
  return [...source].sort((a, b) => {
    const av = a < OPERATIONAL_DAY_START_HOUR ? a + 24 : a;
    const bv = b < OPERATIONAL_DAY_START_HOUR ? b + 24 : b;
    return av - bv;
  });
}

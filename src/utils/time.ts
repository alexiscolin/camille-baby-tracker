const MINUTES_IN_DAY = 24 * 60;

export function getTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function computeDurationMinutes(
  startTime: string,
  endTime: string,
  maxMinutes: number,
): number | undefined {
  if (!startTime || !endTime) return undefined;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(isNaN)) return undefined;

  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += MINUTES_IN_DAY;
  if (diff > maxMinutes) return undefined;
  return diff;
}

export type StoreSettings = { is_open: boolean };

export type DayHours = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type FormattedHoursLine = {
  label: string;
  hours: string;
}

// Global static maps and formatters 
const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const sydneyDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Australia/Sydney",
  weekday: "short",
});

function mondayFirstOrder(day: number): number {
  return day === 0 ? 7 : day; // Sun becomes 7, Mon=1 … Sat=6
}

function parseTimeParts(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

export function toMinutes(time: string): number {
  const parts = parseTimeParts(time);
  if (!parts) return NaN;
  return parts.hours * 60 + parts.minutes;
}

export function getSydneyNowMinutes(date = new Date()): number {
  const sydString = date.toLocaleTimeString("en-AU", { 
    timeZone: "Australia/Sydney", 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false,
  });

  const [hours, minutes] = sydString.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getSydneyDayOfWeek(now = new Date()): number {
  return WEEKDAY_MAP[sydneyDayFormatter.format(now)];
}

export function isStoreOpenNow(
  settings: StoreSettings,
  weeklyHours: DayHours[],
  now = new Date()
): boolean {
  if (!settings.is_open) return false;

  const today = weeklyHours.find(
    (d) => Number(d.day_of_week) === getSydneyDayOfWeek(now)
  );
  if (!today || today.is_closed) return false;

  const nowMin = getSydneyNowMinutes(now);
  const open = toMinutes(today.open_time);
  const close = toMinutes(today.close_time);

  if (open === close) return false;

  // Handles standard daytime window (e.g., 11:00 -> 20:30)
  if (open < close) {
    return nowMin >= open && nowMin < close;
  }

  // Handles overnight window (e.g., 18:00 -> 02:00)
  return nowMin >= open || nowMin < close;
}

export function formatStoreTime(time: string): string {
  const parts = parseTimeParts(time);
  if (!parts) return time;

  const date = new Date(Date.UTC(1970, 0, 1, parts.hours, parts.minutes));
  return date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatWeeklyHours(weeklyHours: DayHours[]): FormattedHoursLine[] {
  if (!weeklyHours.length) return [];

  const sorted = [...weeklyHours].sort(
    (a, b) => mondayFirstOrder(Number(a.day_of_week)) - mondayFirstOrder(Number(b.day_of_week))
  );

  return sorted.map((day) => {
    const dayNum = Number(day.day_of_week);
    const label = DAY_LABELS[dayNum];

    if (day.is_closed) {
      return { label, hours: "Closed" };
    }

    return {
      label,
      hours: `${formatStoreTime(day.open_time)} – ${formatStoreTime(day.close_time)}`,
    };
  });
}
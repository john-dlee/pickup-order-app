export type StoreSettings = {
  is_open:boolean;
  open_time: string;
  close_time: string;
}

export function toMinutes(hhmmss: string): number {
  const [hours, minutes] = hhmmss.split(":").map(Number);
  return (hours * 60) + minutes;
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

export function isStoreOpenNow(settings: StoreSettings, now = new Date()): boolean {
  if (!settings.is_open) return false;

  const open = toMinutes(settings.open_time);
  const close = toMinutes(settings.close_time);
  const nowMin = getSydneyNowMinutes(now);

  return nowMin >= open && nowMin < close;
}
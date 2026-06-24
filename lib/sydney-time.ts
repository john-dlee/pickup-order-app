const SYDNEY = "Australia/Sydney";

/** YYYY-MM-DD in Australia/Sydney (matches webhook order_date). */
export function getSydneyDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

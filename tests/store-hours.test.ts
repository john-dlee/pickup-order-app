import { describe, expect, test } from "vitest";
import { toMinutes, isStoreOpenNow, type DayHours } from "@/lib/store-hours";

/** Mon=1 … Sun=0 — one day is enough if `now` is that day */
function hoursForDay(
  dayOfWeek: number,
  open = "10:00",
  close = "15:00",
  is_closed = false
): DayHours[] {
  return [{ day_of_week: dayOfWeek, open_time: open, close_time: close, is_closed }];
}

describe("toMinutes", () => {
  test("parses HH:MM", () => {
    expect(toMinutes("10:00")).toBe(600);
    expect(toMinutes("15:30")).toBe(930);
  });
});

describe("isStoreOpenNow", () => {
  const mon = hoursForDay(1, "10:00", "15:00");

  test("false when manual override closed", () => {
    expect(isStoreOpenNow({ is_open: false }, mon, new Date("2026-07-20T02:00:00.000Z"))).toBe(false);
  });

  test("false at close time", () => {
    expect(isStoreOpenNow({ is_open: true }, mon, new Date("2026-07-20T05:00:00.000Z"))).toBe(false);
    expect(isStoreOpenNow({ is_open: true }, mon, new Date("2026-07-20T05:30:00.000Z"))).toBe(false);
  });

  test("false before open", () => {
    expect(isStoreOpenNow({ is_open: true }, mon, new Date("2026-07-19T23:00:00.000Z"))).toBe(false);
  });

  test("true during open hours", () => {
    expect(isStoreOpenNow({ is_open: true }, mon, new Date("2026-07-20T02:00:00.000Z"))).toBe(true);
    expect(isStoreOpenNow({ is_open: true }, mon, new Date("2026-07-20T00:00:00.000Z"))).toBe(true);
    expect(isStoreOpenNow({ is_open: true }, mon, new Date("2026-07-20T04:40:00.000Z"))).toBe(true);
  });
})


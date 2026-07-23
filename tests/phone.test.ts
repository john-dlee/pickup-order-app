import { normaliseAuMobile } from "@/lib/phone";
import { expect, describe, test } from 'vitest';

describe("normaliseAuMobile", () => {
  test("accepts 04 with spaces", () => {
    expect(normaliseAuMobile("0412 345 678")).toBe("+61412345678");
  });

  test("accepts 04 without spaces", () => {
    expect(normaliseAuMobile("0412345678")).toBe("+61412345678");
  });

  test("accepts 04 with leading and trailing spaces", () => {
    expect(normaliseAuMobile(" 041 23 45 67 8 ")).toBe("+61412345678");
  });

  test("accepts +61 with spaces", () => {
    expect(normaliseAuMobile("+61412 345 678")).toBe("+61412345678");
  });

  test("accepts +61 without spaces", () => {
    expect(normaliseAuMobile("+61412345678")).toBe("+61412345678");
  });

  test("accepts +61 with leading and trailing space", () => {
    expect(normaliseAuMobile(" +614 12 345 678 ")).toBe("+61412345678");
  });
});


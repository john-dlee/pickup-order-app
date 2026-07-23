import { describe, test, expect} from "vitest";
import { formatDisplayPrice, gstFromInclusiveCents } from "@/lib/utils";

describe("formatDisplayPrice", () => {
  test("formats whole dollar", () => {
    expect(formatDisplayPrice(1100)).toBe("$11.00");
    expect(formatDisplayPrice(25000)).toBe("$250.00");
    expect(formatDisplayPrice(100)).toBe("$1.00");
  });

  test("formats cents", () => {
    expect(formatDisplayPrice(99)).toBe("$0.99");
    expect(formatDisplayPrice(97)).toBe("$0.97");
    expect(formatDisplayPrice(1)).toBe("$0.01");
    expect(formatDisplayPrice(1011)).toBe("$10.11");
  });

  test("formats zero", () => {
    expect(formatDisplayPrice(0)).toBe("$0.00");
  });
});

describe("gstFromInclusiveCents", () => {
  test("returns GST portion in cents", () => {
    expect(gstFromInclusiveCents(1100)).toBe(100);
    expect(gstFromInclusiveCents(1150)).toBe(105);
    expect(gstFromInclusiveCents(3700)).toBe(336);
  });
});
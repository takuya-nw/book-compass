import { describe, expect, it } from "vitest";
import {
  dateInputToTimestamp,
  formatReadingDate,
  toDateInputValue,
  validateReadingDateOrder
} from "@/utils/readingDates";

describe("読書日付", () => {
  it("日付入力と保存形式を往復変換できる", () => {
    const timestamp = dateInputToTimestamp("2026-07-10");
    expect(timestamp).toBeTruthy();
    expect(toDateInputValue(timestamp)).toBe("2026-07-10");
    expect(dateInputToTimestamp("2026-02-31")).toBeUndefined();
  });

  it("開始日より前の読了日を拒否する", () => {
    expect(validateReadingDateOrder("2026-07-10", "2026-07-09")).toBeTruthy();
    expect(validateReadingDateOrder("2026-07-10", "2026-07-10")).toBeUndefined();
    expect(validateReadingDateOrder("", "2026-07-10")).toBeUndefined();
  });

  it("日付を日本語で表示できる", () => {
    const timestamp = dateInputToTimestamp("2026-07-10");
    expect(formatReadingDate(timestamp)).toContain("2026");
    expect(formatReadingDate(undefined)).toBe("未設定");
  });
});

import { describe, expect, it } from "vitest";
import type { Book } from "@/types/book";
import {
  formatIsbn,
  formatReviewAverage,
  formatReviewCount,
  formatReviewSummary
} from "@/utils/bookDisplay";

const googleBook: Book = {
  id: "google-1",
  title: "Googleの本",
  authors: ["山田 太郎"],
  categories: [],
  source: "google",
  sourceId: "google-1"
};

describe("book display helpers", () => {
  it("ISBN-13を優先し、なければISBN-10を表示する", () => {
    expect(formatIsbn({ ...googleBook, isbn10: "123456789X", isbn13: "9781234567897" })).toBe("9781234567897");
    expect(formatIsbn({ ...googleBook, isbn10: "123456789X" })).toBe("123456789X");
    expect(formatIsbn(googleBook)).toBe("ISBN情報なし");
  });

  it("Google Booksに評価情報がない場合の文言を表示する", () => {
    expect(formatReviewAverage(googleBook)).toBe("Google Books APIでは評価情報なし");
    expect(formatReviewCount(googleBook)).toBe("Google Books APIでは評価情報なし");
    expect(formatReviewSummary(googleBook)).toBe("Google Books APIでは評価情報なし");
  });
});

import { describe, expect, it } from "vitest";
import { mockBooks } from "@/mock/books";

describe("デモ用の本", () => {
  it("外部リンクがGoogle Booksに統一されている", () => {
    const externalLinks = mockBooks
      .map((book) => book.productUrl)
      .filter((url): url is string => Boolean(url));

    expect(externalLinks.length).toBeGreaterThan(0);
    expect(externalLinks.every((url) => url.startsWith("https://books.google.com/"))).toBe(
      true
    );
  });
});

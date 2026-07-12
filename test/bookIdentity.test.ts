import { describe, expect, it } from "vitest";
import type { Book } from "@/types/book";
import { areSameBook } from "@/utils/bookIdentity";

const baseBook: Book = {
  id: "a",
  title: "小さな本棚",
  authors: ["山田 太郎"],
  publisher: "読書出版",
  categories: [],
  source: "mock",
  sourceId: "a"
};

describe("book identity", () => {
  it("ISBNが同じ本を重複として判定する", () => {
    expect(
      areSameBook(
        { ...baseBook, id: "a", isbn13: "978-4-00-000000-0" },
        { ...baseBook, id: "b", isbn13: "9784000000000", sourceId: "b" }
      )
    ).toBe(true);
  });

  it("ISBNがない場合は書名・著者・出版社で重複判定する", () => {
    expect(
      areSameBook(
        { ...baseBook, title: "小さな 本棚" },
        { ...baseBook, id: "b", title: "小さな本棚", sourceId: "b" }
      )
    ).toBe(true);
  });
});

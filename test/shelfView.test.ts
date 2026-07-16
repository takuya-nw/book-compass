import { describe, expect, it } from "vitest";
import type { Book, UserBook } from "@/types/book";
import { createShelfView, type ShelfItem } from "@/utils/shelfView";

function createItem(
  id: string,
  title: string,
  rating?: number,
  note?: string
): ShelfItem {
  const book: Book = {
    id,
    title,
    authors: ["山田 太郎"],
    categories: [],
    source: "mock",
    sourceId: id
  };
  const userBook: UserBook = {
    id: `user-${id}`,
    bookId: id,
    status: "completed",
    personalRating: rating,
    personalNote: note,
    registeredAt: `2026-07-0${id}T00:00:00.000Z`,
    updatedAt: `2026-07-0${id}T00:00:00.000Z`
  };
  return { book, userBook };
}

const items = [
  createItem("1", "星の本", 5, "何度も読み返したい"),
  createItem("2", "月の本"),
  createItem("3", "海の本", 3, "風景描写が印象的")
];

describe("本棚の絞り込みと並び替え", () => {
  it("評価の有無とメモの有無で絞り込める", () => {
    const rated = createShelfView(items, {
      status: "all",
      review: "rated",
      query: "",
      sort: "registeredAt"
    });
    const withNote = createShelfView(items, {
      status: "all",
      review: "withNote",
      query: "",
      sort: "registeredAt"
    });

    expect(rated.map(({ book }) => book.id)).toEqual(["3", "1"]);
    expect(withNote.map(({ book }) => book.id)).toEqual(["3", "1"]);
  });

  it("メモ本文を検索できる", () => {
    const result = createShelfView(items, {
      status: "all",
      review: "all",
      query: "読み返し",
      sort: "registeredAt"
    });

    expect(result.map(({ book }) => book.id)).toEqual(["1"]);
  });

  it("自分の評価が高い順に並べられる", () => {
    const result = createShelfView(items, {
      status: "all",
      review: "all",
      query: "",
      sort: "personalRating"
    });

    expect(result.map(({ book }) => book.id)).toEqual(["1", "3", "2"]);
  });
});

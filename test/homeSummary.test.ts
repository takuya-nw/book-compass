import { describe, expect, it } from "vitest";
import type { Book, UserBook } from "@/types/book";
import { createHomeSummary, getRecentCompletedItems } from "@/utils/homeSummary";
import type { ShelfItem } from "@/utils/shelfView";

function createItem(
  id: string,
  status: UserBook["status"],
  finishedAt?: string,
  personalRating?: number
): ShelfItem {
  const book: Book = {
    id,
    title: `本${id}`,
    authors: [],
    categories: [],
    source: "mock",
    sourceId: id
  };
  const userBook: UserBook = {
    id: `user-${id}`,
    bookId: id,
    status,
    personalRating,
    registeredAt: "2026-07-01T00:00:00.000Z",
    updatedAt: finishedAt ?? "2026-07-01T00:00:00.000Z",
    finishedAt
  };
  return { book, userBook };
}

describe("ホーム画面の読書集計", () => {
  const items = [
    createItem("1", "wantToRead"),
    createItem("2", "reading"),
    createItem("3", "completed", "2026-07-10T00:00:00.000Z", 4),
    createItem("4", "completed", "2026-07-15T00:00:00.000Z", 5),
    createItem("5", "notInterested")
  ];

  it("ステータスと評価済みの冊数を集計できる", () => {
    expect(createHomeSummary(items)).toEqual({
      wantToRead: 1,
      reading: 1,
      completed: 2,
      notInterested: 1,
      rated: 2
    });
  });

  it("最近読了した順に取得できる", () => {
    expect(getRecentCompletedItems(items, 2).map(({ book }) => book.id)).toEqual([
      "4",
      "3"
    ]);
  });
});

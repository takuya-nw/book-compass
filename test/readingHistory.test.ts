import { describe, expect, it } from "vitest";
import type { Book, UserBook } from "@/types/book";
import {
  createReadingHistory,
  getAvailableHistoryYears
} from "@/utils/readingHistory";
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
    authors: ["著者"],
    categories: [],
    source: "mock",
    sourceId: id
  };
  const userBook: UserBook = {
    id: `user-${id}`,
    bookId: id,
    status,
    personalRating,
    registeredAt: "2025-01-01T00:00:00.000Z",
    updatedAt: finishedAt ?? "2026-01-01T00:00:00.000Z",
    finishedAt
  };
  return { book, userBook };
}

const items = [
  createItem("1", "completed", "2026-01-10T00:00:00.000Z", 5),
  createItem("2", "completed", "2026-01-20T00:00:00.000Z", 3),
  createItem("3", "completed", "2026-03-01T00:00:00.000Z"),
  createItem("4", "completed"),
  createItem("5", "completed", "2025-12-31T00:00:00.000Z", 4),
  createItem("6", "reading", "2026-02-01T00:00:00.000Z", 5)
];

describe("読書記録の集計", () => {
  it("読了日がある年を新しい順に取得できる", () => {
    expect(getAvailableHistoryYears(items, 2027)).toEqual([2027, 2026, 2025]);
  });

  it("年ごとの月別冊数と評価を集計できる", () => {
    const history = createReadingHistory(items, 2026);

    expect(history.completedItems.map(({ book }) => book.id)).toEqual(["3", "2", "1"]);
    expect(history.monthlyCounts[0]).toBe(2);
    expect(history.monthlyCounts[2]).toBe(1);
    expect(history.monthlyCounts.reduce((sum, count) => sum + count, 0)).toBe(3);
    expect(history.ratedCount).toBe(2);
    expect(history.averageRating).toBe(4);
  });

  it("読了日未設定の本を推定せず別扱いにする", () => {
    const history = createReadingHistory(items, 2026);

    expect(history.undatedItems.map(({ book }) => book.id)).toEqual(["4"]);
    expect(history.completedItems.some(({ book }) => book.id === "4")).toBe(false);
  });
});

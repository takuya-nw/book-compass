import { describe, expect, it } from "vitest";
import type { Book } from "@/types/book";
import {
  addBookToShelf,
  createEmptyBookshelf,
  updateUserBookDates,
  updateUserBookReview,
  updateUserBookStatus
} from "@/repositories/bookshelfRepository";

const book: Book = {
  id: "book-1",
  isbn13: "9784000000000",
  title: "本棚テスト",
  authors: ["山田 太郎"],
  publisher: "読書出版",
  categories: [],
  source: "mock",
  sourceId: "book-1"
};

describe("bookshelf repository", () => {
  it("本棚への追加とステータス変更ができる", () => {
    const added = addBookToShelf(createEmptyBookshelf(), book);
    expect(added.added).toBe(true);
    expect(added.data.userBooks[0].status).toBe("wantToRead");

    const updated = updateUserBookStatus(added.data, book.id, "reading");
    expect(updated.userBooks[0].status).toBe("reading");
    expect(updated.userBooks[0].startedAt).toBeTruthy();
  });

  it("重複登録を防ぐ", () => {
    const first = addBookToShelf(createEmptyBookshelf(), book);
    const duplicate = addBookToShelf(first.data, {
      ...book,
      id: "book-2",
      sourceId: "book-2"
    });

    expect(duplicate.added).toBe(false);
    expect(duplicate.data.userBooks).toHaveLength(1);
  });

  it("自分の評価とメモを保存できる", () => {
    const added = addBookToShelf(createEmptyBookshelf(), book);
    const updated = updateUserBookReview(added.data, book.id, {
      personalRating: 5,
      personalNote: "読み返したい"
    });

    expect(updated.userBooks[0].personalRating).toBe(5);
    expect(updated.userBooks[0].personalNote).toBe("読み返したい");
  });

  it("読み始めた日と読み終えた日を更新・消去できる", () => {
    const added = addBookToShelf(createEmptyBookshelf(), book);
    const updated = updateUserBookDates(added.data, book.id, {
      startedAt: "2026-07-01T00:00:00.000Z",
      finishedAt: "2026-07-10T00:00:00.000Z"
    });

    expect(updated.userBooks[0].startedAt).toBe("2026-07-01T00:00:00.000Z");
    expect(updated.userBooks[0].finishedAt).toBe("2026-07-10T00:00:00.000Z");

    const cleared = updateUserBookDates(updated, book.id, {});
    expect(cleared.userBooks[0].startedAt).toBeUndefined();
    expect(cleared.userBooks[0].finishedAt).toBeUndefined();
  });
});

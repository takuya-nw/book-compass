import { describe, expect, it } from "vitest";
import type { Book } from "@/types/book";
import {
  addBookToShelf,
  createEmptyBookshelf,
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
});

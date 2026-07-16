import { describe, expect, it } from "vitest";
import type { BookshelfData } from "@/types/book";
import { exportBookshelfData, parseBackupData } from "@/utils/backup";

const data: BookshelfData = {
  version: 1,
  books: [
    {
      id: "book-1",
      title: "バックアップの本",
      authors: ["山田 太郎"],
      categories: [],
      source: "mock",
      sourceId: "book-1"
    }
  ],
  userBooks: [
    {
      id: "user-book-1",
      bookId: "book-1",
      status: "completed",
      personalRating: 4,
      personalNote: "バックアップ確認用メモ",
      registeredAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z"
    }
  ]
};

describe("backup", () => {
  it("JSONバックアップの出力と復元ができる", () => {
    const exported = exportBookshelfData(data);
    expect(parseBackupData(exported)).toEqual(data);
  });

  it("不正なJSONを拒否する", () => {
    expect(() => parseBackupData("{broken")).toThrow();
    expect(() => parseBackupData(JSON.stringify({ version: 1 }))).toThrow();
  });

  it("型が正しくない本や日付を拒否する", () => {
    const invalidAuthor = structuredClone(data);
    invalidAuthor.books[0].authors = [123 as unknown as string];
    expect(() => parseBackupData(JSON.stringify(invalidAuthor))).toThrow();

    const invalidDate = structuredClone(data);
    invalidDate.userBooks[0].updatedAt = "日付ではない";
    expect(() => parseBackupData(JSON.stringify(invalidDate))).toThrow();
  });

  it("重複IDや存在しない本への読書記録を拒否する", () => {
    const duplicateBook = structuredClone(data);
    duplicateBook.books.push(structuredClone(duplicateBook.books[0]));
    expect(() => parseBackupData(JSON.stringify(duplicateBook))).toThrow();

    const missingBook = structuredClone(data);
    missingBook.userBooks[0].bookId = "missing-book";
    expect(() => parseBackupData(JSON.stringify(missingBook))).toThrow();

    const duplicateRegistration = structuredClone(data);
    duplicateRegistration.userBooks.push({
      ...structuredClone(duplicateRegistration.userBooks[0]),
      id: "user-book-2"
    });
    expect(() => parseBackupData(JSON.stringify(duplicateRegistration))).toThrow();
  });
});

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
});

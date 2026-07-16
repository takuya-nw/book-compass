import { describe, expect, it } from "vitest";
import type { BookshelfData } from "@/types/book";
import {
  exportBookCompassBackup,
  exportBookshelfData,
  parseBackupData,
  parseBookCompassBackup
} from "@/utils/backup";
import type { RecommendationPreferences } from "@/utils/recommendationPreferences";

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
      startedAt: "2026-07-01T00:00:00.000Z",
      finishedAt: "2026-07-10T00:00:00.000Z",
      registeredAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z"
    }
  ]
};

const recommendationPreferences: RecommendationPreferences = {
  version: 1,
  dismissedBookKeys: ["isbn:9784000000099"],
  feedback: [
    {
      bookKey: "isbn:9784000000001",
      bookTitle: "気になる本",
      signal: "interested",
      authors: ["山田 太郎"],
      categories: ["教養"],
      updatedAt: "2026-07-16T00:00:00.000Z"
    }
  ]
};

describe("backup", () => {
  it("JSONバックアップの出力と復元ができる", () => {
    const exported = exportBookshelfData(data);
    expect(parseBackupData(exported)).toEqual(data);
  });

  it("本棚とおすすめ学習データを一緒に出力・復元できる", () => {
    const exported = exportBookCompassBackup(data, recommendationPreferences);
    expect(parseBookCompassBackup(exported)).toEqual({
      bookshelf: data,
      recommendationPreferences
    });
  });

  it("旧形式の本棚バックアップも復元できる", () => {
    expect(parseBookCompassBackup(exportBookshelfData(data))).toEqual({
      bookshelf: data
    });
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

  it("不正なおすすめ学習データを拒否する", () => {
    const invalid = JSON.parse(
      exportBookCompassBackup(data, recommendationPreferences)
    );
    invalid.recommendationPreferences.feedback[0].updatedAt = "日付ではない";

    expect(() => parseBookCompassBackup(JSON.stringify(invalid))).toThrow(
      "おすすめの学習データ"
    );
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

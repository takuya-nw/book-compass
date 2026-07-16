import { afterEach, describe, expect, it, vi } from "vitest";
import { localStorageBackupRepository } from "@/repositories/localStorageBackupRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { localStorageRecommendationRepository } from "@/repositories/localStorageRecommendationRepository";
import {
  exportBookCompassBackup,
  exportBookshelfData
} from "@/utils/backup";
import { createEmptyRecommendationPreferences } from "@/utils/recommendationPreferences";
import type { Book, BookshelfData } from "@/types/book";

const book: Book = {
  id: "backup-feedback-book",
  title: "学習もバックアップする本",
  authors: ["山田太郎"],
  categories: ["教養"],
  source: "mock",
  sourceId: "backup-feedback-book"
};

const bookshelf: BookshelfData = {
  version: 1,
  books: [book],
  userBooks: [
    {
      id: "user-backup-feedback-book",
      bookId: book.id,
      status: "wantToRead",
      registeredAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z"
    }
  ]
};

function stubLocalStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    }
  });
  return values;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localStorage統合バックアップ", () => {
  it("本棚とおすすめ学習データを一緒に復元する", () => {
    stubLocalStorage();
    localStorageBookshelfRepository.save(bookshelf);
    localStorageRecommendationRepository.setFeedback(book, "interested");
    const exported = localStorageBackupRepository.export(bookshelf);
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }

    localStorageBookshelfRepository.save({ version: 1, books: [], userBooks: [] });
    localStorageRecommendationRepository.clear();
    const restored = localStorageBackupRepository.restore(exported.value);

    expect(restored.ok).toBe(true);
    expect(localStorageBookshelfRepository.load()).toEqual({
      ok: true,
      value: bookshelf
    });
    const preferences = localStorageRecommendationRepository.load();
    expect(preferences.ok && preferences.value.feedback[0].signal).toBe(
      "interested"
    );
  });

  it("旧形式の復元では現在のおすすめ学習データを維持する", () => {
    stubLocalStorage();
    localStorageRecommendationRepository.setFeedback(book, "notForMe");

    const restored = localStorageBackupRepository.restore(
      exportBookshelfData(bookshelf)
    );

    expect(restored.ok).toBe(true);
    const preferences = localStorageRecommendationRepository.load();
    expect(preferences.ok && preferences.value.feedback[0].signal).toBe(
      "notForMe"
    );
  });

  it("現在の本棚保存が壊れていても正しいバックアップから復旧できる", () => {
    const values = stubLocalStorage();
    values.set("book-compass-bookshelf-v1", "{broken");
    const backup = exportBookCompassBackup(
      bookshelf,
      createEmptyRecommendationPreferences()
    );

    expect(localStorageBackupRepository.restore(backup).ok).toBe(true);
    expect(localStorageBookshelfRepository.load()).toEqual({
      ok: true,
      value: bookshelf
    });
  });
});

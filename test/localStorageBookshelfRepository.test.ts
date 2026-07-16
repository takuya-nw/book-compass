import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyBookshelf } from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type { Book, BookshelfData } from "@/types/book";

const book: Book = {
  id: "storage-test-book",
  title: "保存テスト",
  authors: ["山田 太郎"],
  categories: [],
  source: "mock",
  sourceId: "storage-test-book"
};

const existingData: BookshelfData = {
  version: 1,
  books: [book],
  userBooks: [
    {
      id: "user-storage-test-book",
      bookId: book.id,
      status: "wantToRead",
      registeredAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z"
    }
  ]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localStorage本棚リポジトリ", () => {
  it("ブラウザの保存機能を取得できない場合はエラーを返す", () => {
    const blockedWindow = Object.defineProperty({}, "localStorage", {
      get() {
        throw new Error("blocked");
      }
    });
    vi.stubGlobal("window", blockedWindow);

    expect(localStorageBookshelfRepository.load()).toEqual({
      ok: false,
      error: "本棚データを読み込めませんでした。ブラウザの保存設定をご確認ください。"
    });
    expect(localStorageBookshelfRepository.save(createEmptyBookshelf())).toEqual({
      ok: false,
      error: "本棚データを保存できませんでした。空き容量やブラウザの保存設定をご確認ください。"
    });
  });

  it("本棚への書き込みが拒否された場合はエラーを返す", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("blocked");
        }
      }
    });

    const result = localStorageBookshelfRepository.addBook(book);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("本棚データを保存できませんでした。");
    }
  });

  it("詳細画面用キャッシュの保存失敗で操作を止めない", () => {
    vi.stubGlobal("window", {
      localStorage: {
        setItem: () => {
          throw new Error("blocked");
        }
      }
    });

    expect(() => localStorageBookshelfRepository.rememberBook(book)).not.toThrow();
  });

  it("不正なバックアップで現在データを上書きしない", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => JSON.stringify(existingData),
        setItem
      }
    });

    const result = localStorageBookshelfRepository.restore("{broken");

    expect(result.ok).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorageBookshelfRepository.load()).toEqual({
      ok: true,
      value: existingData
    });
  });

  it("正しいバックアップだけを保存する", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem
      }
    });

    const result = localStorageBookshelfRepository.restore(
      JSON.stringify(existingData)
    );

    expect(result).toEqual({ ok: true, value: existingData });
    expect(setItem).toHaveBeenCalledOnce();
  });
});

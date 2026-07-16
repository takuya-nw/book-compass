import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyBookshelf } from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type { Book } from "@/types/book";

const book: Book = {
  id: "storage-test-book",
  title: "保存テスト",
  authors: ["山田 太郎"],
  categories: [],
  source: "mock",
  sourceId: "storage-test-book"
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
});

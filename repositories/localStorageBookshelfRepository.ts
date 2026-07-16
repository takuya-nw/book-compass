"use client";

import type { Book, BookshelfData, ReadingStatus } from "@/types/book";
import {
  addBookToShelf,
  createEmptyBookshelf,
  removeUserBook,
  updateUserBookDates,
  updateUserBookReview,
  updateUserBookStatus
} from "@/repositories/bookshelfRepository";
import { parseBackupData } from "@/utils/backup";

const STORAGE_KEY = "book-compass-bookshelf-v1";
const RECENT_BOOK_KEY = "book-compass-recent-book";

export type RepositoryResult<T> =
  | { ok: true; value: T; message?: string }
  | { ok: false; error: string };

export const localStorageBookshelfRepository = {
  load(): RepositoryResult<BookshelfData> {
    if (typeof window === "undefined") {
      return { ok: true, value: createEmptyBookshelf() };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ok: true, value: createEmptyBookshelf() };
      }
      return { ok: true, value: parseBackupData(raw) };
    } catch {
      return {
        ok: false,
        error:
          "本棚データを読み込めませんでした。ブラウザの保存設定をご確認ください。"
      };
    }
  },

  save(data: BookshelfData): RepositoryResult<BookshelfData> {
    if (typeof window === "undefined") {
      return { ok: true, value: data };
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { ok: true, value: data };
    } catch {
      return {
        ok: false,
        error:
          "本棚データを保存できませんでした。空き容量やブラウザの保存設定をご確認ください。"
      };
    }
  },

  addBook(book: Book, status: ReadingStatus = "wantToRead") {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }
    const result = addBookToShelf(loaded.value, book, status);
    const saved = this.save(result.data);
    if (!saved.ok) {
      return saved;
    }
    return {
      ok: true as const,
      value: result.data,
      message: result.message ?? "本棚に追加しました。"
    };
  },

  updateStatus(bookId: string, status: ReadingStatus) {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }
    return this.save(updateUserBookStatus(loaded.value, bookId, status));
  },

  updateReview(
    bookId: string,
    review: { personalRating?: number; personalNote?: string }
  ) {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }
    return this.save(updateUserBookReview(loaded.value, bookId, review));
  },

  updateDates(
    bookId: string,
    dates: { startedAt?: string; finishedAt?: string }
  ) {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }
    return this.save(updateUserBookDates(loaded.value, bookId, dates));
  },

  remove(bookId: string) {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }
    return this.save(removeUserBook(loaded.value, bookId));
  },

  rememberBook(book: Book) {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(RECENT_BOOK_KEY, JSON.stringify(book));
    } catch {
      // This cache only supports navigation; the detail API remains available.
    }
  },

  loadRememberedBook(id: string): Book | undefined {
    if (typeof window === "undefined") {
      return undefined;
    }
    try {
      const raw = window.localStorage.getItem(RECENT_BOOK_KEY);
      if (!raw) {
        return undefined;
      }
      const book = JSON.parse(raw) as Book;
      return book.id === id ? book : undefined;
    } catch {
      return undefined;
    }
  },

  replace(data: BookshelfData) {
    return this.save(data);
  },

  restore(raw: string): RepositoryResult<BookshelfData> {
    try {
      const restored = parseBackupData(raw);
      return this.save(restored);
    } catch (restoreError) {
      return {
        ok: false,
        error:
          restoreError instanceof Error
            ? restoreError.message
            : "バックアップを読み込めませんでした。"
      };
    }
  }
};

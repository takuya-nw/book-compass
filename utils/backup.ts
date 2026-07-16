import type { Book, BookshelfData, UserBook } from "@/types/book";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBook(value: unknown): value is Book {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.authors) &&
    Array.isArray(value.categories) &&
    (value.source === "rakuten" || value.source === "google" || value.source === "mock") &&
    typeof value.sourceId === "string"
  );
}

function isUserBook(value: unknown): value is UserBook {
  const rating = value && isRecord(value) ? value.personalRating : undefined;
  const note = value && isRecord(value) ? value.personalNote : undefined;

  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.bookId === "string" &&
    typeof value.registeredAt === "string" &&
    typeof value.updatedAt === "string" &&
    (rating === undefined ||
      (typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5)) &&
    (note === undefined || typeof note === "string") &&
    (value.status === "wantToRead" ||
      value.status === "reading" ||
      value.status === "completed" ||
      value.status === "notInterested")
  );
}

export function isBookshelfData(value: unknown): value is BookshelfData {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.books) &&
    Array.isArray(value.userBooks) &&
    value.books.every(isBook) &&
    value.userBooks.every(isUserBook)
  );
}

export function parseBackupData(raw: string): BookshelfData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSONの形式が正しくありません。バックアップファイルをご確認ください。");
  }

  if (!isBookshelfData(parsed)) {
    throw new Error("Book Compassのバックアップデータとして読み込めませんでした。");
  }

  return parsed;
}

export function exportBookshelfData(data: BookshelfData): string {
  return JSON.stringify(data, null, 2);
}

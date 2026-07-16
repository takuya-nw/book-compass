import type { Book, BookshelfData, UserBook } from "@/types/book";
import {
  parseRecommendationPreferencesValue,
  type RecommendationPreferences
} from "@/utils/recommendationPreferences";

export type ParsedBookCompassBackup = {
  bookshelf: BookshelfData;
  recommendationPreferences?: RecommendationPreferences;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalNumber(
  value: unknown,
  predicate: (number: number) => boolean = () => true
): value is number | undefined {
  return value === undefined || (typeof value === "number" && Number.isFinite(value) && predicate(value));
}

function isTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isOptionalTimestamp(value: unknown): value is string | undefined {
  return value === undefined || isTimestamp(value);
}

function isBook(value: unknown): value is Book {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isOptionalString(value.isbn10) &&
    isOptionalString(value.isbn13) &&
    isOptionalString(value.subtitle) &&
    isStringArray(value.authors) &&
    isOptionalString(value.publisher) &&
    isOptionalString(value.publishedDate) &&
    isOptionalString(value.description) &&
    isOptionalNumber(value.price, (number) => number >= 0) &&
    isOptionalString(value.currency) &&
    isOptionalString(value.thumbnailUrl) &&
    isOptionalString(value.largeImageUrl) &&
    isStringArray(value.categories) &&
    isOptionalNumber(value.reviewAverage, (number) => number >= 0 && number <= 5) &&
    isOptionalNumber(
      value.reviewCount,
      (number) => Number.isInteger(number) && number >= 0
    ) &&
    isOptionalString(value.productUrl) &&
    (value.source === "rakuten" || value.source === "google" || value.source === "mock") &&
    isNonEmptyString(value.sourceId)
  );
}

function isUserBook(value: unknown): value is UserBook {
  const rating = value && isRecord(value) ? value.personalRating : undefined;
  const note = value && isRecord(value) ? value.personalNote : undefined;

  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.bookId) &&
    isTimestamp(value.registeredAt) &&
    isTimestamp(value.updatedAt) &&
    isOptionalTimestamp(value.startedAt) &&
    isOptionalTimestamp(value.finishedAt) &&
    (rating === undefined ||
      (typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5)) &&
    (note === undefined || typeof note === "string") &&
    (value.status === "wantToRead" ||
      value.status === "reading" ||
      value.status === "completed" ||
      value.status === "notInterested")
  );
}

function hasUniqueValues(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function hasValidRelationships(data: BookshelfData): boolean {
  const bookIds = data.books.map((book) => book.id);
  const userBookIds = data.userBooks.map((userBook) => userBook.id);
  const registeredBookIds = data.userBooks.map((userBook) => userBook.bookId);
  const knownBookIds = new Set(bookIds);

  return (
    hasUniqueValues(bookIds) &&
    hasUniqueValues(userBookIds) &&
    hasUniqueValues(registeredBookIds) &&
    registeredBookIds.every((bookId) => knownBookIds.has(bookId))
  );
}

export function isBookshelfData(value: unknown): value is BookshelfData {
  if (!(
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.books) &&
    Array.isArray(value.userBooks) &&
    value.books.every(isBook) &&
    value.userBooks.every(isUserBook)
  )) {
    return false;
  }

  return hasValidRelationships(value as BookshelfData);
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

export function parseBookCompassBackup(raw: string): ParsedBookCompassBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSONの形式が正しくありません。バックアップファイルをご確認ください。");
  }

  if (isBookshelfData(parsed)) {
    return { bookshelf: parsed };
  }

  if (
    !isRecord(parsed) ||
    parsed.format !== "book-compass-backup" ||
    parsed.version !== 2 ||
    !isBookshelfData(parsed.bookshelf)
  ) {
    throw new Error("Book Compassのバックアップデータとして読み込めませんでした。");
  }

  try {
    return {
      bookshelf: parsed.bookshelf,
      recommendationPreferences: parseRecommendationPreferencesValue(
        parsed.recommendationPreferences
      )
    };
  } catch {
    throw new Error("おすすめの学習データが正しくありません。バックアップファイルをご確認ください。");
  }
}

export function exportBookCompassBackup(
  bookshelf: BookshelfData,
  recommendationPreferences: RecommendationPreferences
): string {
  return JSON.stringify(
    {
      format: "book-compass-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      bookshelf,
      recommendationPreferences
    },
    null,
    2
  );
}

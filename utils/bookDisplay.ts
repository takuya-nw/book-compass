import type { Book } from "@/types/book";

export function formatIsbn(book: Pick<Book, "isbn10" | "isbn13">): string {
  return book.isbn13 ?? book.isbn10 ?? "ISBN情報なし";
}

export function formatReviewAverage(book: Pick<Book, "reviewAverage" | "source">): string {
  if (typeof book.reviewAverage === "number") {
    return String(book.reviewAverage);
  }
  return book.source === "google"
    ? "Google Books APIでは評価情報なし"
    : "評価情報なし";
}

export function formatReviewCount(book: Pick<Book, "reviewCount" | "source">): string {
  if (typeof book.reviewCount === "number") {
    return `${book.reviewCount}件`;
  }
  return book.source === "google"
    ? "Google Books APIでは評価情報なし"
    : "評価情報なし";
}

export function formatReviewSummary(book: Pick<Book, "reviewAverage" | "reviewCount" | "source">): string {
  if (typeof book.reviewAverage === "number" || typeof book.reviewCount === "number") {
    return `平均 ${book.reviewAverage ?? "不明"} / 件数 ${
      typeof book.reviewCount === "number" ? `${book.reviewCount}件` : "不明"
    }`;
  }
  return book.source === "google"
    ? "Google Books APIでは評価情報なし"
    : "評価情報なし";
}

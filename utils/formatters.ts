import type { ReadingStatus } from "@/types/book";

export const statusLabels: Record<ReadingStatus, string> = {
  wantToRead: "読みたい",
  reading: "読書中",
  completed: "読了",
  notInterested: "興味なし"
};

export function formatPrice(price?: number, currency = "JPY"): string {
  if (typeof price !== "number") {
    return "価格不明";
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(price);
}

export function formatAuthors(authors: string[]): string {
  return authors.length > 0 ? authors.join("、") : "著者不明";
}

export function formatDate(date?: string): string {
  if (!date) {
    return "発売日不明";
  }
  return date;
}

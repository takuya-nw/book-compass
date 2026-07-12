import { NextResponse } from "next/server";
import { searchBooks } from "@/services/bookSearchService";
import type { BookSearchParams, BookSort, SearchSource } from "@/types/book";

function asSource(value: string | null): SearchSource {
  return value === "rakuten" || value === "google" ? value : "all";
}

function asSort(value: string | null): BookSort {
  const allowed: BookSort[] = [
    "relevance",
    "newest",
    "sales",
    "reviewCount",
    "reviewAverage"
  ];
  return allowed.includes(value as BookSort) ? (value as BookSort) : "relevance";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: BookSearchParams = {
    keyword: searchParams.get("keyword") ?? undefined,
    title: searchParams.get("title") ?? undefined,
    author: searchParams.get("author") ?? undefined,
    isbn: searchParams.get("isbn") ?? undefined,
    source: asSource(searchParams.get("source")),
    sort: asSort(searchParams.get("sort"))
  };

  const result = await searchBooks(params);
  return NextResponse.json(result);
}

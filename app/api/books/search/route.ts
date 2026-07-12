import { NextResponse } from "next/server";
import { searchBooks } from "@/services/bookSearchService";
import type { BookSearchParams, BookSort } from "@/types/book";

function asSort(value: string | null): BookSort {
  const allowed: BookSort[] = ["relevance", "newest"];
  return allowed.includes(value as BookSort) ? (value as BookSort) : "relevance";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: BookSearchParams = {
    keyword: searchParams.get("keyword") ?? undefined,
    title: searchParams.get("title") ?? undefined,
    author: searchParams.get("author") ?? undefined,
    isbn: searchParams.get("isbn") ?? undefined,
    source: "google",
    sort: asSort(searchParams.get("sort"))
  };

  const result = await searchBooks(params);
  return NextResponse.json(result);
}

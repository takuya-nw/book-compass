import type { Book, BookSearchParams } from "@/types/book";
import { mapGoogleResponseToBooks } from "@/services/mappers/googleBooksMapper";

const GOOGLE_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

function buildGoogleQuery(params: BookSearchParams): string {
  const parts: string[] = [];
  if (params.isbn) {
    parts.push(`isbn:${params.isbn}`);
  }
  if (params.title) {
    parts.push(`intitle:${params.title}`);
  }
  if (params.author) {
    parts.push(`inauthor:${params.author}`);
  }
  if (params.keyword && parts.length === 0) {
    parts.push(params.keyword);
  }
  return parts.join("+") || "本";
}

function buildGoogleOrderBy(sort: BookSearchParams["sort"]): "relevance" | "newest" {
  return sort === "newest" ? "newest" : "relevance";
}

export function hasGoogleBooksKey(): boolean {
  return Boolean(process.env.GOOGLE_BOOKS_API_KEY);
}

export async function searchGoogleBooks(params: BookSearchParams): Promise<Book[]> {
  if (!hasGoogleBooksKey()) {
    return [];
  }

  const url = new URL(GOOGLE_ENDPOINT);
  url.searchParams.set("q", buildGoogleQuery(params));
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("printType", "books");
  url.searchParams.set("langRestrict", "ja");
  url.searchParams.set("orderBy", buildGoogleOrderBy(params.sort));
  url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY ?? "");

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) {
    throw new Error("google-search-failed");
  }

  return mapGoogleResponseToBooks(await response.json());
}

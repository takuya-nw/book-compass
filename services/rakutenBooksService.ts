import type { Book, BookSearchParams } from "@/types/book";
import { mapRakutenResponseToBooks } from "@/services/mappers/rakutenMapper";

const RAKUTEN_ENDPOINT = "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404";

function buildRakutenSort(sort: BookSearchParams["sort"]): string {
  switch (sort) {
    case "newest":
      return "-releaseDate";
    case "sales":
      return "sales";
    case "reviewCount":
      return "reviewCount";
    case "reviewAverage":
      return "reviewAverage";
    default:
      return "standard";
  }
}

export function hasRakutenKeys(): boolean {
  return Boolean(process.env.RAKUTEN_APPLICATION_ID);
}

export async function searchRakutenBooks(params: BookSearchParams): Promise<Book[]> {
  if (!hasRakutenKeys()) {
    return [];
  }

  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set("applicationId", process.env.RAKUTEN_APPLICATION_ID ?? "");
  if (process.env.RAKUTEN_ACCESS_KEY) {
    url.searchParams.set("accessKey", process.env.RAKUTEN_ACCESS_KEY);
  }
  url.searchParams.set("format", "json");
  url.searchParams.set("hits", "24");
  url.searchParams.set("sort", buildRakutenSort(params.sort));

  if (params.isbn) {
    url.searchParams.set("isbn", params.isbn);
  }
  if (params.title) {
    url.searchParams.set("title", params.title);
  }
  if (params.author) {
    url.searchParams.set("author", params.author);
  }
  if (params.keyword && !params.title && !params.author && !params.isbn) {
    url.searchParams.set("title", params.keyword);
  }

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) {
    throw new Error("rakuten-search-failed");
  }

  return mapRakutenResponseToBooks(await response.json());
}

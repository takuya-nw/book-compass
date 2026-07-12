import type { Book } from "@/types/book";
import { normalizeIsbn } from "@/utils/bookIdentity";

type RakutenBookItem = {
  Item?: {
    title?: string;
    subTitle?: string;
    author?: string;
    publisherName?: string;
    salesDate?: string;
    isbn?: string;
    itemPrice?: number;
    mediumImageUrl?: string;
    largeImageUrl?: string;
    itemUrl?: string;
    reviewAverage?: string | number;
    reviewCount?: number;
    booksGenreId?: string;
    itemCaption?: string;
    itemCode?: string;
  };
};

export type RakutenBooksResponse = {
  Items?: RakutenBookItem[];
};

function splitAuthors(author?: string): string[] {
  if (!author) {
    return [];
  }
  return author
    .split(/[／,/、]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function normalizeImageUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  return url.replace("?_ex=120x120", "").replace("?_ex=200x200", "");
}

export function mapRakutenItemToBook(raw: RakutenBookItem): Book | null {
  const item = raw.Item;
  if (!item?.title) {
    return null;
  }

  const isbn = normalizeIsbn(item.isbn);
  const isbn10 = isbn?.length === 10 ? isbn : undefined;
  const isbn13 = isbn?.length === 13 ? isbn : undefined;
  const sourceId = item.itemCode ?? isbn ?? `${item.title}-${item.author ?? ""}`;
  const largeImageUrl = normalizeImageUrl(item.largeImageUrl);
  const thumbnailUrl = normalizeImageUrl(item.mediumImageUrl) ?? largeImageUrl;

  return {
    id: `rakuten-${sourceId}`,
    isbn10,
    isbn13,
    title: item.title,
    subtitle: item.subTitle,
    authors: splitAuthors(item.author),
    publisher: item.publisherName,
    publishedDate: item.salesDate,
    description: item.itemCaption,
    price: item.itemPrice,
    currency: "JPY",
    thumbnailUrl,
    largeImageUrl: largeImageUrl ?? thumbnailUrl,
    categories: item.booksGenreId ? [item.booksGenreId] : [],
    reviewAverage:
      item.reviewAverage === undefined ? undefined : Number(item.reviewAverage),
    reviewCount: item.reviewCount,
    productUrl: item.itemUrl,
    source: "rakuten",
    sourceId
  };
}

export function mapRakutenResponseToBooks(response: RakutenBooksResponse): Book[] {
  return (response.Items ?? [])
    .map(mapRakutenItemToBook)
    .filter((book): book is Book => Boolean(book));
}

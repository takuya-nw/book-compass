import type { Book } from "@/types/book";
import { normalizeIsbn } from "@/utils/bookIdentity";

type GoogleIndustryIdentifier = {
  type?: string;
  identifier?: string;
};

type GoogleBooksItem = {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: GoogleIndustryIdentifier[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
    };
    categories?: string[];
    infoLink?: string;
  };
  saleInfo?: {
    listPrice?: {
      amount?: number;
      currencyCode?: string;
    };
    retailPrice?: {
      amount?: number;
      currencyCode?: string;
    };
  };
};

export type GoogleBooksResponse = {
  items?: GoogleBooksItem[];
};

function findIsbn(
  identifiers: GoogleIndustryIdentifier[] | undefined,
  type: "ISBN_10" | "ISBN_13"
): string | undefined {
  const value = identifiers?.find((identifier) => identifier.type === type)?.identifier;
  return normalizeIsbn(value);
}

function secureImageUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

export function mapGoogleItemToBook(item: GoogleBooksItem): Book | null {
  const volume = item.volumeInfo;
  if (!volume?.title) {
    return null;
  }

  const isbn10 = findIsbn(volume.industryIdentifiers, "ISBN_10");
  const isbn13 = findIsbn(volume.industryIdentifiers, "ISBN_13");
  const price = item.saleInfo?.listPrice ?? item.saleInfo?.retailPrice;
  const sourceId = item.id ?? isbn13 ?? isbn10 ?? volume.title;
  const thumbnailUrl = secureImageUrl(volume.imageLinks?.thumbnail);

  return {
    id: `google-${sourceId}`,
    isbn10,
    isbn13,
    title: volume.title,
    subtitle: volume.subtitle,
    authors: volume.authors ?? [],
    publisher: volume.publisher,
    publishedDate: volume.publishedDate,
    description: volume.description,
    price: price?.amount,
    currency: price?.currencyCode,
    thumbnailUrl,
    largeImageUrl: thumbnailUrl,
    categories: volume.categories ?? [],
    productUrl: volume.infoLink,
    source: "google",
    sourceId
  };
}

export function mapGoogleResponseToBooks(response: GoogleBooksResponse): Book[] {
  return (response.items ?? [])
    .map(mapGoogleItemToBook)
    .filter((book): book is Book => Boolean(book));
}

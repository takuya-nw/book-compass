import type { Book, ReadingStatus, UserBook } from "@/types/book";
import { normalizeText } from "@/utils/bookIdentity";

export type ShelfItem = {
  book: Book;
  userBook: UserBook;
};

export type ShelfStatusFilter = "all" | ReadingStatus;
export type ShelfReviewFilter = "all" | "rated" | "unrated" | "withNote";
export type ShelfSort =
  | "registeredAt"
  | "publishedDate"
  | "title"
  | "author"
  | "personalRating";

type ShelfViewOptions = {
  status: ShelfStatusFilter;
  review: ShelfReviewFilter;
  query: string;
  sort: ShelfSort;
};

function matchesReviewFilter(userBook: UserBook, filter: ShelfReviewFilter): boolean {
  if (filter === "rated") {
    return typeof userBook.personalRating === "number";
  }
  if (filter === "unrated") {
    return typeof userBook.personalRating !== "number";
  }
  if (filter === "withNote") {
    return Boolean(userBook.personalNote?.trim());
  }
  return true;
}

export function createShelfView(
  items: ShelfItem[],
  options: ShelfViewOptions
): ShelfItem[] {
  const normalizedQuery = normalizeText(options.query);

  return items
    .filter(
      ({ userBook }) => options.status === "all" || userBook.status === options.status
    )
    .filter(({ userBook }) => matchesReviewFilter(userBook, options.review))
    .filter(({ book, userBook }) => {
      if (!normalizedQuery) {
        return true;
      }

      return normalizeText(
        [
          book.title,
          book.subtitle,
          ...book.authors,
          book.publisher,
          book.isbn10,
          book.isbn13,
          userBook.personalNote
        ].join(" ")
      ).includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (options.sort === "publishedDate") {
        return (b.book.publishedDate ?? "").localeCompare(a.book.publishedDate ?? "");
      }
      if (options.sort === "title") {
        return a.book.title.localeCompare(b.book.title, "ja");
      }
      if (options.sort === "author") {
        return (a.book.authors[0] ?? "").localeCompare(b.book.authors[0] ?? "", "ja");
      }
      if (options.sort === "personalRating") {
        const ratingDifference =
          (b.userBook.personalRating ?? 0) - (a.userBook.personalRating ?? 0);
        if (ratingDifference !== 0) {
          return ratingDifference;
        }
        return (
          new Date(b.userBook.updatedAt).getTime() -
          new Date(a.userBook.updatedAt).getTime()
        );
      }
      return (
        new Date(b.userBook.registeredAt).getTime() -
        new Date(a.userBook.registeredAt).getTime()
      );
    });
}

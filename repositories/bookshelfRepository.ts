import type { Book, BookshelfData, ReadingStatus, UserBook } from "@/types/book";
import { areSameBook } from "@/utils/bookIdentity";
import type { ReadingDates } from "@/utils/readingDates";

export function createEmptyBookshelf(): BookshelfData {
  return {
    version: 1,
    books: [],
    userBooks: []
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function withStatusDates(
  userBook: UserBook,
  status: ReadingStatus,
  now: string
): UserBook {
  return {
    ...userBook,
    status,
    updatedAt: now,
    startedAt: status === "reading" && !userBook.startedAt ? now : userBook.startedAt,
    finishedAt: status === "completed" && !userBook.finishedAt ? now : userBook.finishedAt
  };
}

export function addBookToShelf(
  data: BookshelfData,
  book: Book,
  status: ReadingStatus = "wantToRead"
): { data: BookshelfData; userBook: UserBook; added: boolean; message?: string } {
  const existingBook = data.books.find((candidate) => areSameBook(candidate, book));
  const targetBook = existingBook ?? book;
  const existingUserBook = data.userBooks.find(
    (candidate) => candidate.bookId === targetBook.id
  );

  if (existingUserBook) {
    return {
      data,
      userBook: existingUserBook,
      added: false,
      message: "この本はすでに本棚に登録されています。"
    };
  }

  const now = new Date().toISOString();
  const userBook = withStatusDates(
    {
      id: createId("user-book"),
      bookId: targetBook.id,
      status,
      registeredAt: now,
      updatedAt: now
    },
    status,
    now
  );

  return {
    data: {
      ...data,
      books: existingBook ? data.books : [...data.books, book],
      userBooks: [...data.userBooks, userBook]
    },
    userBook,
    added: true
  };
}

export function updateUserBookStatus(
  data: BookshelfData,
  bookId: string,
  status: ReadingStatus
): BookshelfData {
  const now = new Date().toISOString();
  return {
    ...data,
    userBooks: data.userBooks.map((userBook) =>
      userBook.bookId === bookId ? withStatusDates(userBook, status, now) : userBook
    )
  };
}

export function updateUserBookReview(
  data: BookshelfData,
  bookId: string,
  review: { personalRating?: number; personalNote?: string }
): BookshelfData {
  const now = new Date().toISOString();
  const normalizedRating =
    typeof review.personalRating === "number"
      ? Math.min(5, Math.max(1, Math.round(review.personalRating)))
      : undefined;
  const normalizedNote = review.personalNote?.trim() || undefined;

  return {
    ...data,
    userBooks: data.userBooks.map((userBook) =>
      userBook.bookId === bookId
        ? {
            ...userBook,
            personalRating: normalizedRating,
            personalNote: normalizedNote,
            updatedAt: now
          }
        : userBook
    )
  };
}

export function updateUserBookDates(
  data: BookshelfData,
  bookId: string,
  dates: ReadingDates
): BookshelfData {
  const now = new Date().toISOString();
  return {
    ...data,
    userBooks: data.userBooks.map((userBook) =>
      userBook.bookId === bookId
        ? {
            ...userBook,
            startedAt: dates.startedAt,
            finishedAt: dates.finishedAt,
            updatedAt: now
          }
        : userBook
    )
  };
}

export function removeUserBook(data: BookshelfData, bookId: string): BookshelfData {
  return {
    ...data,
    userBooks: data.userBooks.filter((userBook) => userBook.bookId !== bookId)
  };
}

export function getShelfBook(data: BookshelfData, bookId: string) {
  const book = data.books.find((item) => item.id === bookId);
  const userBook = data.userBooks.find((item) => item.bookId === bookId);
  return book && userBook ? { book, userBook } : undefined;
}

export function getShelfItems(data: BookshelfData) {
  return data.userBooks
    .map((userBook) => {
      const book = data.books.find((item) => item.id === userBook.bookId);
      return book ? { book, userBook } : undefined;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

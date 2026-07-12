export type BookSource = "rakuten" | "google" | "mock";

export type ReadingStatus =
  | "wantToRead"
  | "reading"
  | "completed"
  | "notInterested";

export type SearchSource = "all" | "rakuten" | "google";

export type BookSort =
  | "relevance"
  | "newest"
  | "sales"
  | "reviewCount"
  | "reviewAverage";

export type Book = {
  id: string;
  isbn10?: string;
  isbn13?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  largeImageUrl?: string;
  categories: string[];
  reviewAverage?: number;
  reviewCount?: number;
  productUrl?: string;
  source: BookSource;
  sourceId: string;
};

export type UserBook = {
  id: string;
  bookId: string;
  status: ReadingStatus;
  registeredAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
};

export type BookshelfData = {
  version: 1;
  books: Book[];
  userBooks: UserBook[];
};

export type BookSearchParams = {
  keyword?: string;
  title?: string;
  author?: string;
  isbn?: string;
  source: SearchSource;
  sort: BookSort;
};

export type BookSearchResult = {
  books: Book[];
  demoMode: boolean;
  messages: string[];
};

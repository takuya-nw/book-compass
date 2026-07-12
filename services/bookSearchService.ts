import { mockBooks } from "@/mock/books";
import type { Book, BookSearchParams, BookSearchResult } from "@/types/book";
import { mergeDuplicateBooks, normalizeText } from "@/utils/bookIdentity";
import { hasGoogleBooksKey, searchGoogleBooks } from "@/services/googleBooksService";
import { hasRakutenKeys, searchRakutenBooks } from "@/services/rakutenBooksService";

function matchesDemoBook(params: BookSearchParams, text: string): boolean {
  const queries = [params.keyword, params.title, params.author, params.isbn]
    .map(normalizeText)
    .filter(Boolean);
  return queries.length === 0 || queries.some((query) => text.includes(query));
}

function searchMockBooks(params: BookSearchParams) {
  return mockBooks.filter((book) => {
    const text = normalizeText(
      [
        book.title,
        book.subtitle,
        ...book.authors,
        book.publisher,
        book.isbn10,
        book.isbn13
      ].join(" ")
    );
    return matchesDemoBook(params, text);
  });
}

export async function searchBooks(params: BookSearchParams): Promise<BookSearchResult> {
  const messages: string[] = [];
  const tasks: Promise<unknown>[] = [];
  const books: Book[] = [];
  const shouldUseRakuten = params.source === "all" || params.source === "rakuten";
  const shouldUseGoogle = params.source === "all" || params.source === "google";

  if (shouldUseRakuten && hasRakutenKeys()) {
    tasks.push(
      searchRakutenBooks(params)
        .then((items) => books.push(...items))
        .catch(() => messages.push("楽天ブックスから本を取得できませんでした。時間をおいてもう一度お試しください。"))
    );
  } else if (shouldUseRakuten) {
    messages.push("楽天ブックスAPIキーが未設定のため、デモ用の本を表示しています。");
  }

  if (shouldUseGoogle && hasGoogleBooksKey()) {
    tasks.push(
      searchGoogleBooks(params)
        .then((items) => books.push(...items))
        .catch(() => messages.push("Google Booksから本を取得できませんでした。時間をおいてもう一度お試しください。"))
    );
  } else if (shouldUseGoogle) {
    messages.push("Google Books APIキーが未設定のため、デモ用の本を表示しています。");
  }

  await Promise.all(tasks);

  const demoMode = books.length === 0;
  const resultBooks = demoMode ? searchMockBooks(params) : mergeDuplicateBooks(books);

  if (resultBooks.length === 0) {
    messages.push("条件に合う本が見つかりませんでした。キーワードを少し変えて検索してください。");
  }

  return {
    books: resultBooks,
    demoMode,
    messages: Array.from(new Set(messages))
  };
}

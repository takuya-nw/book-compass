import { mockBooks } from "@/mock/books";
import type { Book, BookSearchParams, BookSearchResult } from "@/types/book";
import { mergeDuplicateBooks, normalizeText } from "@/utils/bookIdentity";
import { hasGoogleBooksKey, searchGoogleBooks } from "@/services/googleBooksService";

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
        book.isbn13,
        ...book.categories
      ].join(" ")
    );
    return matchesDemoBook(params, text);
  });
}

export async function searchBooks(params: BookSearchParams): Promise<BookSearchResult> {
  const messages: string[] = [];
  const books: Book[] = [];

  if (hasGoogleBooksKey()) {
    try {
      books.push(...(await searchGoogleBooks(params)));
    } catch {
      messages.push("Google Booksから本を取得できませんでした。時間をおいてもう一度お試しください。");
    }
  } else {
    messages.push("Google Books APIキーが未設定のため、デモ用の本を表示しています。");
  }

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

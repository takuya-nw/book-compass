"use client";

import { Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookCard } from "@/components/BookCard";
import { Notice } from "@/components/Notice";
import { createEmptyBookshelf, getShelfItems } from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type {
  Book,
  BookSearchResult,
  BookSort,
  BookshelfData,
  ReadingStatus,
  SearchSource
} from "@/types/book";

const sortOptions: { value: BookSort; label: string; rakutenOnly?: boolean }[] = [
  { value: "relevance", label: "関連度順" },
  { value: "newest", label: "発売日の新しい順" },
  { value: "sales", label: "売れている順", rakutenOnly: true },
  { value: "reviewCount", label: "レビュー件数順", rakutenOnly: true },
  { value: "reviewAverage", label: "レビュー評価順", rakutenOnly: true }
];

function isSortDisabled(source: SearchSource, sort: BookSort): boolean {
  return source === "google" && ["sales", "reviewCount", "reviewAverage"].includes(sort);
}

export function SearchClient() {
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [source, setSource] = useState<SearchSource>("all");
  const [sort, setSort] = useState<BookSort>("relevance");
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [shelf, setShelf] = useState<BookshelfData>(createEmptyBookshelf());

  useEffect(() => {
    const loaded = localStorageBookshelfRepository.load();
    if (loaded.ok) {
      setShelf(loaded.value);
    }
  }, [feedback]);

  const statusByBookId = useMemo(() => {
    const map = new Map<string, ReadingStatus>();
    getShelfItems(shelf).forEach(({ book, userBook }) => {
      map.set(book.id, userBook.status);
    });
    return map;
  }, [shelf]);

  function handleSourceChange(value: SearchSource) {
    setSource(value);
    if (isSortDisabled(value, sort)) {
      setSort("relevance");
    }
  }

  async function handleSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setFeedback("");
    setMessages([]);
    setSearched(true);

    const params = new URLSearchParams({
      keyword,
      title,
      author,
      isbn,
      source,
      sort
    });

    try {
      const response = await fetch(`/api/books/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("search-failed");
      }
      const result = (await response.json()) as BookSearchResult;
      setBooks(result.books);
      setMessages(result.messages);
    } catch {
      setBooks([]);
      setMessages([
        "本を検索できませんでした。通信環境を確認して、もう一度お試しください。"
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold text-sage">本を探す</p>
        <h1 className="mt-1 text-3xl font-bold">検索して本棚に追加</h1>
      </div>

      <form onSubmit={handleSearch} className="surface grid gap-4 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="label">フリーワード</span>
            <input className="input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="気になる言葉を入力" />
          </label>
          <label className="grid gap-2">
            <span className="label">書名</span>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="書名で探す" />
          </label>
          <label className="grid gap-2">
            <span className="label">著者</span>
            <input className="input" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="著者名で探す" />
          </label>
          <label className="grid gap-2">
            <span className="label">ISBN</span>
            <input className="input" value={isbn} onChange={(event) => setIsbn(event.target.value)} placeholder="978..." />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="label">検索元</span>
            <select
              className="input"
              value={source}
              onChange={(event) => handleSourceChange(event.target.value as SearchSource)}
            >
              <option value="all">すべて</option>
              <option value="rakuten">楽天ブックス</option>
              <option value="google">Google Books</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">並び替え</span>
            <select
              className="input"
              value={sort}
              onChange={(event) => setSort(event.target.value as BookSort)}
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={isSortDisabled(source, option.value)}
                >
                  {option.label}
                  {source === "google" && option.rakutenOnly ? "（Googleでは利用不可）" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            APIキー未設定時はデモ用の本を表示します。
          </p>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Search size={18} aria-hidden="true" />
            {loading ? "検索中" : "検索する"}
          </button>
        </div>
      </form>

      <div className="mt-5 grid gap-3">
        {feedback ? <Notice message={feedback} tone="success" /> : null}
        {messages.map((message) => (
          <Notice key={message} message={message} />
        ))}
      </div>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">検索結果</h2>
          <p className="text-sm text-muted">{searched ? `${books.length}件` : "未検索"}</p>
        </div>
        {loading ? (
          <div className="surface p-6 text-muted">本を探しています。</div>
        ) : books.length === 0 && searched ? (
          <div className="surface p-6 text-muted">
            表示できる本がありません。条件を変えて検索してください。
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {books.map((book) => (
              <BookCard
                key={`${book.source}-${book.sourceId}`}
                book={book}
                shelfStatus={statusByBookId.get(book.id)}
                onMessage={setFeedback}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

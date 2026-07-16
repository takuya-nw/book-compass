"use client";

import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookCover } from "@/components/BookCover";
import { Notice } from "@/components/Notice";
import { PersonalReviewPanel } from "@/components/PersonalReviewPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusControls } from "@/components/StatusControls";
import {
  createEmptyBookshelf,
  getShelfBook,
  getShelfItems
} from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type { Book, BookshelfData, ReadingStatus } from "@/types/book";
import { formatIsbn, formatReviewSummary } from "@/utils/bookDisplay";
import { formatAuthors, formatPrice } from "@/utils/formatters";

const sourceLabels = {
  rakuten: "楽天ブックス",
  google: "Google Books",
  mock: "デモデータ"
};

export function BookDetailClient({ id }: { id: string }) {
  const [book, setBook] = useState<Book | undefined>();
  const [shelf, setShelf] = useState<BookshelfData>(createEmptyBookshelf());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function refreshShelf() {
    const loaded = localStorageBookshelfRepository.load();
    if (loaded.ok) {
      setShelf(loaded.value);
    } else {
      setError(loaded.error);
    }
  }

  useEffect(() => {
    refreshShelf();
    const remembered = localStorageBookshelfRepository.loadRememberedBook(id);
    if (remembered) {
      setBook(remembered);
      return;
    }

    const loaded = localStorageBookshelfRepository.load();
    if (loaded.ok) {
      const shelfItem = getShelfBook(loaded.value, id);
      if (shelfItem) {
        setBook(shelfItem.book);
        return;
      }
    }

    fetch(`/api/books/${encodeURIComponent(id)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { book: Book }) => setBook(payload.book))
      .catch(() =>
        setError(
          "本の詳細を表示できませんでした。検索結果または本棚からもう一度開いてください。"
        )
      );
  }, [id]);

  const shelfItem = useMemo(() => {
    if (!book) {
      return undefined;
    }
    return getShelfItems(shelf).find((item) => item.book.id === book.id);
  }, [book, shelf]);

  function handleStatus(status: ReadingStatus) {
    if (!book) {
      return;
    }

    const result = shelfItem
      ? localStorageBookshelfRepository.updateStatus(book.id, status)
      : localStorageBookshelfRepository.addBook(book, status);

    if (result.ok) {
      setMessage("本棚を更新しました。");
      refreshShelf();
    } else {
      setError(result.error);
    }
  }

  function handleRemove() {
    if (!book) {
      return;
    }

    const confirmed = window.confirm("この本を本棚から削除します。よろしいですか？");
    if (!confirmed) {
      return;
    }

    const result = localStorageBookshelfRepository.remove(book.id);
    if (result.ok) {
      setMessage("本棚から削除しました。");
      refreshShelf();
    } else {
      setError(result.error);
    }
  }

  function handleReviewSave(review: { personalRating?: number; personalNote?: string }) {
    if (!book) {
      return;
    }

    const result = shelfItem
      ? localStorageBookshelfRepository.updateReview(book.id, review)
      : localStorageBookshelfRepository.addBook(book, "completed");

    if (result.ok && !shelfItem) {
      const savedReview = localStorageBookshelfRepository.updateReview(book.id, review);
      if (!savedReview.ok) {
        setError(savedReview.error);
        return;
      }
    } else if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("読後メモを保存しました。");
    setError("");
    refreshShelf();
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? <Notice message={error} tone="error" /> : <div className="surface p-6 text-muted">本の詳細を読み込んでいます。</div>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex items-center gap-2 text-sm text-muted">
        <Link href="/search" className="font-semibold text-sage hover:underline">
          本を探す
        </Link>
        <span>/</span>
        <span>本の詳細</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="flex justify-center lg:justify-start">
          <BookCover src={book.largeImageUrl ?? book.thumbnailUrl} title={book.title} size="large" />
        </aside>
        <section className="surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-xs font-bold text-sage">
              {sourceLabels[book.source]}
            </span>
            {shelfItem ? <StatusBadge status={shelfItem.userBook.status} /> : null}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight">{book.title}</h1>
          {book.subtitle ? <p className="mt-2 text-lg text-muted">{book.subtitle}</p> : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="label">著者</dt>
              <dd className="mt-1 text-muted">{formatAuthors(book.authors)}</dd>
            </div>
            <div>
              <dt className="label">出版社</dt>
              <dd className="mt-1 text-muted">{book.publisher ?? "出版社不明"}</dd>
            </div>
            <div>
              <dt className="label">発売日</dt>
              <dd className="mt-1 text-muted">{book.publishedDate ?? "発売日不明"}</dd>
            </div>
            <div>
              <dt className="label">ISBN</dt>
              <dd className="mt-1 text-muted">{formatIsbn(book)}</dd>
            </div>
            <div>
              <dt className="label">価格</dt>
              <dd className="mt-1 text-muted">{formatPrice(book.price, book.currency)}</dd>
            </div>
            <div>
              <dt className="label">レビュー</dt>
              <dd className="mt-1 text-muted">{formatReviewSummary(book)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <h2 className="label">説明文</h2>
            <p className="mt-2 whitespace-pre-line leading-7 text-muted">
              {book.description ?? "説明文は取得できませんでした。"}
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <StatusControls currentStatus={shelfItem?.userBook.status} onChange={handleStatus} />
            <div className="flex flex-col gap-2 sm:flex-row">
              {book.productUrl ? (
                <a
                  href={book.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <ExternalLink size={18} aria-hidden="true" />
                  Google Booksで見る
                </a>
              ) : null}
              {shelfItem ? (
                <button type="button" className="btn-secondary" onClick={handleRemove}>
                  <Trash2 size={18} aria-hidden="true" />
                  本棚から削除
                </button>
              ) : null}
            </div>
          </div>

          <PersonalReviewPanel
            userBook={shelfItem?.userBook}
            onSave={handleReviewSave}
          />

          <div className="mt-5 grid gap-3">
            {message ? <Notice message={message} tone="success" /> : null}
            {error ? <Notice message={error} tone="error" /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { Check, Info, Plus } from "lucide-react";
import type { Book, ReadingStatus } from "@/types/book";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { formatAuthors, formatDate, formatPrice } from "@/utils/formatters";
import { BookCover } from "@/components/BookCover";

type BookCardProps = {
  book: Book;
  onMessage?: (message: string) => void;
  shelfStatus?: ReadingStatus;
};

const sourceLabels = {
  rakuten: "楽天ブックス",
  google: "Google Books",
  mock: "デモデータ"
};

export function BookCard({ book, onMessage, shelfStatus }: BookCardProps) {
  function addToShelf() {
    const result = localStorageBookshelfRepository.addBook(book);
    onMessage?.(result.ok ? result.message ?? "本棚に追加しました。" : result.error);
  }

  function rememberBook() {
    localStorageBookshelfRepository.rememberBook(book);
  }

  return (
    <article className="surface flex h-full flex-col p-4">
      <div className="flex gap-4">
        <BookCover src={book.thumbnailUrl} title={book.title} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-sage">{sourceLabels[book.source]}</p>
          <h3 className="line-clamp-3 text-lg font-bold leading-snug text-ink">
            {book.title}
          </h3>
          <p className="mt-2 text-sm text-muted">{formatAuthors(book.authors)}</p>
          <p className="mt-1 text-sm text-muted">{book.publisher ?? "出版社不明"}</p>
          <p className="mt-1 text-sm text-muted">{formatDate(book.publishedDate)}</p>
          <p className="mt-3 font-semibold text-ink">{formatPrice(book.price, book.currency)}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-[#f8f1e6] p-2">
          <dt className="text-muted">レビュー平均</dt>
          <dd className="font-semibold">{book.reviewAverage ?? "なし"}</dd>
        </div>
        <div className="rounded-md bg-[#f8f1e6] p-2">
          <dt className="text-muted">レビュー件数</dt>
          <dd className="font-semibold">{book.reviewCount ?? "なし"}</dd>
        </div>
      </dl>

      <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
        <Link
          href={`/books/${encodeURIComponent(book.id)}`}
          onClick={rememberBook}
          className="btn-secondary"
        >
          <Info size={18} aria-hidden="true" />
          詳細を見る
        </Link>
        <button type="button" className="btn-primary" onClick={addToShelf}>
          {shelfStatus ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
          {shelfStatus ? "登録済み" : "本棚に追加"}
        </button>
      </div>
    </article>
  );
}

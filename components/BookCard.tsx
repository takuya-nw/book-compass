"use client";

import Link from "next/link";
import { Check, Heart, Info, Plus, Sparkles, ThumbsDown, X } from "lucide-react";
import type { Book, ReadingStatus } from "@/types/book";
import type { RecommendationSignal } from "@/utils/recommendationPreferences";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { formatIsbn, formatReviewAverage, formatReviewCount } from "@/utils/bookDisplay";
import { formatAuthors, formatDate, formatPrice } from "@/utils/formatters";
import { BookCover } from "@/components/BookCover";

type BookCardProps = {
  book: Book;
  onMessage?: (message: string, tone: "success" | "error") => void;
  onDismiss?: (book: Book) => void;
  onRecommendationSignal?: (book: Book, signal: RecommendationSignal) => void;
  recommendationReasons?: string[];
  recommendationSignal?: RecommendationSignal;
  shelfStatus?: ReadingStatus;
};

const sourceLabels = {
  rakuten: "楽天ブックス",
  google: "Google Books",
  mock: "デモデータ"
};

export function BookCard({
  book,
  onDismiss,
  onMessage,
  onRecommendationSignal,
  recommendationReasons,
  recommendationSignal,
  shelfStatus
}: BookCardProps) {
  function addToShelf() {
    const result = localStorageBookshelfRepository.addBook(book);
    onMessage?.(
      result.ok ? result.message ?? "本棚に追加しました。" : result.error,
      result.ok ? "success" : "error"
    );
  }

  function rememberBook() {
    localStorageBookshelfRepository.rememberBook(book);
  }

  return (
    <article className="surface relative flex h-full flex-col p-4">
      {onDismiss ? (
        <button
          type="button"
          onClick={() => onDismiss(book)}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:border-clay hover:text-clay"
          aria-label={`「${book.title}」をおすすめから外す`}
          title="おすすめから外す"
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
      {recommendationReasons && recommendationReasons.length > 0 ? (
        <div
          className={`mb-3 flex items-start gap-2 rounded-md bg-[#edf5ef] py-2 pl-3 text-sm text-ink ${
            onDismiss ? "pr-12" : "pr-3"
          }`}
        >
          <Sparkles className="mt-0.5 shrink-0 text-sage" size={17} aria-hidden="true" />
          <p className="leading-6">
            <span className="font-bold">おすすめの理由: </span>
            {recommendationReasons.join("・")}
          </p>
        </div>
      ) : null}
      <div className={`flex gap-4 ${onDismiss ? "pr-10" : ""}`}>
        <BookCover src={book.thumbnailUrl} title={book.title} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-sage">{sourceLabels[book.source]}</p>
          <h3 className="line-clamp-3 text-lg font-bold leading-snug text-ink">
            {book.title}
          </h3>
          <p className="mt-2 text-sm text-muted">{formatAuthors(book.authors)}</p>
          <p className="mt-1 text-sm text-muted">{book.publisher ?? "出版社不明"}</p>
          <p className="mt-1 text-sm text-muted">{formatDate(book.publishedDate)}</p>
          <p className="mt-1 text-sm text-muted">ISBN: {formatIsbn(book)}</p>
          <p className="mt-3 font-semibold text-ink">{formatPrice(book.price, book.currency)}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md bg-[#f8f1e6] p-2">
          <dt className="text-muted">レビュー平均</dt>
          <dd className="font-semibold">{formatReviewAverage(book)}</dd>
        </div>
        <div className="rounded-md bg-[#f8f1e6] p-2">
          <dt className="text-muted">レビュー件数</dt>
          <dd className="font-semibold">{formatReviewCount(book)}</dd>
        </div>
      </dl>

      {onRecommendationSignal ? (
        <div
          className="mt-3 grid grid-cols-2 gap-2"
          role="group"
          aria-label={`「${book.title}」へのおすすめの反応`}
        >
          <button
            type="button"
            onClick={() => onRecommendationSignal(book, "interested")}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
              recommendationSignal === "interested"
                ? "border-sage bg-sage text-white"
                : "border-line bg-white text-muted hover:border-sage hover:text-sage"
            }`}
            aria-pressed={recommendationSignal === "interested"}
          >
            <Heart size={17} aria-hidden="true" />
            {recommendationSignal === "interested" ? "気になる済み" : "気になる"}
          </button>
          <button
            type="button"
            onClick={() => onRecommendationSignal(book, "notForMe")}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
              recommendationSignal === "notForMe"
                ? "border-clay bg-clay text-white"
                : "border-line bg-white text-muted hover:border-clay hover:text-clay"
            }`}
            aria-pressed={recommendationSignal === "notForMe"}
          >
            <ThumbsDown size={17} aria-hidden="true" />
            {recommendationSignal === "notForMe" ? "合わない済み" : "合わない"}
          </button>
        </div>
      ) : null}

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

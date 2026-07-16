"use client";

import Link from "next/link";
import { CalendarDays, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackupPanel } from "@/components/BackupPanel";
import { BookCover } from "@/components/BookCover";
import { Notice } from "@/components/Notice";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusControls } from "@/components/StatusControls";
import {
  createEmptyBookshelf,
  getShelfItems
} from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type { BookshelfData, ReadingStatus } from "@/types/book";
import { formatAuthors, statusLabels } from "@/utils/formatters";
import {
  createShelfView,
  type ShelfReviewFilter,
  type ShelfSort,
  type ShelfStatusFilter
} from "@/utils/shelfView";
import { formatReadingDate } from "@/utils/readingDates";

const filters: { value: ShelfStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "wantToRead", label: "読みたい" },
  { value: "reading", label: "読書中" },
  { value: "completed", label: "読了" },
  { value: "notInterested", label: "興味なし" }
];

export function ShelfClient() {
  const [data, setData] = useState<BookshelfData>(createEmptyBookshelf());
  const [filter, setFilter] = useState<ShelfStatusFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ShelfReviewFilter>("all");
  const [sort, setSort] = useState<ShelfSort>("registeredAt");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function loadShelf() {
    const loaded = localStorageBookshelfRepository.load();
    if (loaded.ok) {
      setData(loaded.value);
    } else {
      setError(loaded.error);
    }
  }

  useEffect(() => {
    loadShelf();
  }, []);

  const items = useMemo(() => {
    return createShelfView(getShelfItems(data), {
      status: filter,
      review: reviewFilter,
      query,
      sort
    });
  }, [data, filter, query, reviewFilter, sort]);

  function updateStatus(bookId: string, status: ReadingStatus) {
    const result = localStorageBookshelfRepository.updateStatus(bookId, status);
    if (result.ok) {
      setData(result.value);
      setMessage("ステータスを更新しました。");
      setError("");
    } else {
      setError(result.error);
    }
  }

  function removeBook(bookId: string) {
    const confirmed = window.confirm("この本を本棚から削除します。よろしいですか？");
    if (!confirmed) {
      return;
    }
    const result = localStorageBookshelfRepository.remove(bookId);
    if (result.ok) {
      setData(result.value);
      setMessage("本棚から削除しました。");
      setError("");
    } else {
      setError(result.error);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold text-sage">マイ本棚</p>
        <h1 className="mt-1 text-3xl font-bold">登録した本を管理</h1>
      </div>

      <div className="grid gap-5">
        <section className="surface grid gap-4 p-4 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                className={filter === item.value ? "btn-primary shrink-0" : "btn-secondary shrink-0"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_220px_220px]">
            <label className="grid gap-2">
              <span className="label">本棚内検索</span>
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
                <input
                  className="input pl-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="書名・著者・ISBN・メモで絞り込み"
                />
              </span>
            </label>
            <label className="grid gap-2">
              <span className="label">読後記録</span>
              <select
                className="input"
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value as ShelfReviewFilter)}
              >
                <option value="all">すべて</option>
                <option value="rated">評価あり</option>
                <option value="unrated">未評価</option>
                <option value="withNote">メモあり</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">並び替え</span>
              <select
                className="input"
                value={sort}
                onChange={(event) => setSort(event.target.value as ShelfSort)}
              >
                <option value="registeredAt">登録日の新しい順</option>
                <option value="publishedDate">発売日の新しい順</option>
                <option value="title">書名順</option>
                <option value="author">著者順</option>
                <option value="personalRating">自分の評価が高い順</option>
              </select>
            </label>
          </div>
        </section>

        <BackupPanel data={data} onRestore={setData} />

        {message ? <Notice message={message} tone="success" /> : null}
        {error ? <Notice message={error} tone="error" /> : null}

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-bold">本棚一覧</h2>
            <p className="text-sm text-muted">{items.length}件</p>
          </div>

          {items.length === 0 ? (
            <div className="surface p-6 text-muted">
              表示できる本がありません。条件を変えるか、本を検索して本棚に追加してください。
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map(({ book, userBook }) => (
                <article key={userBook.id} className="surface p-4">
                  <div className="flex gap-4">
                    <Link
                      href={`/books/${encodeURIComponent(book.id)}`}
                      onClick={() => localStorageBookshelfRepository.rememberBook(book)}
                    >
                      <BookCover src={book.thumbnailUrl} title={book.title} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={userBook.status} />
                        <span className="text-xs text-muted">
                          {statusLabels[userBook.status]}
                        </span>
                      </div>
                      <Link
                        href={`/books/${encodeURIComponent(book.id)}`}
                        onClick={() => localStorageBookshelfRepository.rememberBook(book)}
                        className="line-clamp-3 text-lg font-bold leading-snug hover:text-sage"
                      >
                        {book.title}
                      </Link>
                      <p className="mt-2 text-sm text-muted">{formatAuthors(book.authors)}</p>
                      <p className="mt-1 text-sm text-muted">{book.publisher ?? "出版社不明"}</p>
                      <p className="mt-1 text-sm text-muted">発売日: {book.publishedDate ?? "不明"}</p>
                      <div className="mt-3 grid gap-1 text-sm text-muted">
                        <p className="flex items-center gap-1 font-semibold text-ink">
                          <Star size={16} aria-hidden="true" />
                          自分の評価: {userBook.personalRating ? `${userBook.personalRating} / 5` : "未評価"}
                        </p>
                        {userBook.personalNote ? (
                          <p className="line-clamp-2">{userBook.personalNote}</p>
                        ) : null}
                        {userBook.startedAt ? (
                          <p className="mt-1 flex items-center gap-1">
                            <CalendarDays size={16} aria-hidden="true" />
                            開始: {formatReadingDate(userBook.startedAt)}
                          </p>
                        ) : null}
                        {userBook.finishedAt ? (
                          <p className="flex items-center gap-1">
                            <CalendarDays size={16} aria-hidden="true" />
                            読了: {formatReadingDate(userBook.finishedAt)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <StatusControls
                      currentStatus={userBook.status}
                      onChange={(status) => updateStatus(book.id, status)}
                    />
                    <button
                      type="button"
                      className="btn-secondary justify-self-start"
                      onClick={() => removeBook(book.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                      本棚から削除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { BookCheck, CalendarDays, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookCover } from "@/components/BookCover";
import { Notice } from "@/components/Notice";
import { createEmptyBookshelf, getShelfItems } from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type { BookshelfData } from "@/types/book";
import { formatAuthors } from "@/utils/formatters";
import { formatReadingDate } from "@/utils/readingDates";
import {
  createReadingHistory,
  getAvailableHistoryYears
} from "@/utils/readingHistory";
import type { ShelfItem } from "@/utils/shelfView";

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function HistoryBookCard({ item, dated = true }: { item: ShelfItem; dated?: boolean }) {
  const { book, userBook } = item;
  return (
    <Link
      href={`/books/${encodeURIComponent(book.id)}`}
      onClick={() => localStorageBookshelfRepository.rememberBook(book)}
      className="surface flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <BookCover src={book.thumbnailUrl} title={book.title} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-xs font-bold text-sage">
          <CalendarDays size={15} aria-hidden="true" />
          {dated ? formatReadingDate(userBook.finishedAt) : "読了日未設定"}
        </p>
        <h3 className="mt-2 line-clamp-3 text-lg font-bold leading-snug">{book.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{formatAuthors(book.authors)}</p>
        <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink">
          <Star size={16} aria-hidden="true" />
          {userBook.personalRating ? `${userBook.personalRating} / 5` : "未評価"}
        </p>
        {userBook.personalNote ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
            {userBook.personalNote}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function ReadingHistoryClient() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<BookshelfData>(createEmptyBookshelf());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [error, setError] = useState("");

  useEffect(() => {
    const loaded = localStorageBookshelfRepository.load();
    if (loaded.ok) {
      setData(loaded.value);
    } else {
      setError(loaded.error);
    }
  }, []);

  const items = useMemo(() => getShelfItems(data), [data]);
  const availableYears = useMemo(
    () => getAvailableHistoryYears(items, currentYear),
    [currentYear, items]
  );
  const history = useMemo(
    () => createReadingHistory(items, selectedYear),
    [items, selectedYear]
  );
  const maxMonthlyCount = Math.max(...history.monthlyCounts, 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-sage">読書記録</p>
          <h1 className="mt-1 text-3xl font-bold">読了した本を振り返る</h1>
        </div>
        <label className="grid gap-2 sm:w-44">
          <span className="label">表示する年</span>
          <select
            className="input"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <Notice message={error} tone="error" /> : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <HistoryStat label={`${selectedYear}年の読了`} value={`${history.completedItems.length}冊`} />
        <HistoryStat label="評価した本" value={`${history.ratedCount}冊`} />
        <div className="col-span-2 lg:col-span-1">
          <HistoryStat
            label="平均評価"
            value={history.averageRating ? `${history.averageRating} / 5` : "未評価"}
          />
        </div>
      </section>

      <section className="surface mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <BookCheck className="text-sage" size={20} aria-hidden="true" />
          <h2 className="text-xl font-bold">月別の読了冊数</h2>
        </div>
        <div className="mt-6 grid grid-cols-6 gap-2 lg:grid-cols-12">
          {history.monthlyCounts.map((count, index) => {
            const height = count === 0 ? 4 : Math.max(16, Math.round((count / maxMonthlyCount) * 96));
            return (
              <div
                key={index}
                className="grid h-36 grid-rows-[24px_96px_20px] items-end text-center"
                aria-label={`${index + 1}月 ${count}冊`}
              >
                <span className="text-sm font-bold text-ink">{count}</span>
                <div className="flex h-24 items-end justify-center">
                  <span
                    className="block w-6 rounded-t bg-sage"
                    style={{ height: `${height}px` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs font-semibold text-muted">{index + 1}月</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">{selectedYear}年の読了履歴</h2>
          <p className="text-sm text-muted">{history.completedItems.length}件</p>
        </div>
        {history.completedItems.length === 0 ? (
          <div className="surface p-6 text-muted">
            この年の読了記録はまだありません。
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {history.completedItems.map((item) => (
              <HistoryBookCard key={item.userBook.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {history.undatedItems.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-bold">読了日未設定</h2>
            <p className="text-sm text-muted">{history.undatedItems.length}件</p>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted">
            <CalendarDays size={18} aria-hidden="true" />
            <p>本の詳細画面から読了日を設定できます。</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {history.undatedItems.map((item) => (
              <HistoryBookCard key={item.userBook.id} item={item} dated={false} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Star
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BookshelfData } from "@/types/book";
import { createEmptyBookshelf, getShelfItems } from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { formatAuthors } from "@/utils/formatters";
import { BookCover } from "@/components/BookCover";
import { createHomeSummary, getRecentCompletedItems } from "@/utils/homeSummary";
import { Notice } from "@/components/Notice";

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="surface p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-[#edf5ef] text-sage">
        {icon}
      </div>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

export function HomeClient() {
  const [data, setData] = useState<BookshelfData>(createEmptyBookshelf());
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
  const summary = useMemo(() => createHomeSummary(items), [items]);
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.userBook.registeredAt).getTime() -
        new Date(a.userBook.registeredAt).getTime()
    )
    .slice(0, 4);
  const recentCompletedItems = useMemo(() => getRecentCompletedItems(items), [items]);

  function formatCompletedDate(date: string): string {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(date));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-bold text-sage">個人向け読書管理アプリ</p>
          <h1 className="text-4xl font-bold tracking-normal text-ink sm:text-5xl">
            Book Compass
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            気になる本を探し、自分の本棚に登録して、読みたい・読書中・読了の状態を手元で管理できます。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/search" className="btn-primary">
              本を探す
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/shelf" className="btn-secondary">
              マイ本棚を見る
            </Link>
          </div>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-[#fff6db] text-gold">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold">新刊・おすすめ</h2>
              <p className="text-sm text-muted">今後追加予定</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            第1段階では検索、本棚登録、ステータス管理、バックアップに集中しています。
          </p>
        </div>
      </section>

      {error ? (
        <div className="mt-6">
          <Notice message={error} tone="error" />
        </div>
      ) : null}

      <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="読みたい本" value={summary.wantToRead} icon={<BookMarked size={22} />} />
        <StatCard label="読書中" value={summary.reading} icon={<BookOpen size={22} />} />
        <StatCard label="読了した本" value={summary.completed} icon={<CheckCircle2 size={22} />} />
        <StatCard label="評価した本" value={summary.rated} icon={<Star size={22} />} />
      </section>

      {recentCompletedItems.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">最近読了した本</h2>
            <Link href="/shelf" className="text-sm font-semibold text-sage hover:underline">
              本棚で見る
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {recentCompletedItems.map(({ book, userBook }) => {
              const completedDate = userBook.finishedAt ?? userBook.updatedAt;
              return (
                <Link
                  href={`/books/${encodeURIComponent(book.id)}`}
                  key={userBook.id}
                  onClick={() => localStorageBookshelfRepository.rememberBook(book)}
                  className="surface flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <BookCover src={book.thumbnailUrl} title={book.title} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-sage">
                      読了日: {formatCompletedDate(completedDate)}
                    </p>
                    <h3 className="mt-2 line-clamp-3 font-bold leading-snug">{book.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {formatAuthors(book.authors)}
                    </p>
                    <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink">
                      <Star size={16} aria-hidden="true" />
                      {userBook.personalRating
                        ? `自分の評価: ${userBook.personalRating} / 5`
                        : "自分の評価: 未評価"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">最近登録した本</h2>
          <Link href="/shelf" className="text-sm font-semibold text-sage hover:underline">
            すべて見る
          </Link>
        </div>
        {recentItems.length === 0 ? (
          <div className="surface p-6 text-muted">
            まだ本棚に本がありません。まずは「本を探す」から気になる本を登録してください。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map(({ book }) => (
              <Link
                href={`/books/${encodeURIComponent(book.id)}`}
                key={book.id}
                onClick={() => localStorageBookshelfRepository.rememberBook(book)}
                className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <BookCover src={book.thumbnailUrl} title={book.title} />
                <h3 className="mt-3 line-clamp-2 font-bold">{book.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted">
                  {formatAuthors(book.authors)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

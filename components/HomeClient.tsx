"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Undo2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Book, BookSearchResult, BookshelfData } from "@/types/book";
import { createEmptyBookshelf, getShelfItems } from "@/repositories/bookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { localStorageRecommendationRepository } from "@/repositories/localStorageRecommendationRepository";
import { formatAuthors } from "@/utils/formatters";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/BookCover";
import { createHomeSummary, getRecentCompletedItems } from "@/utils/homeSummary";
import { Notice } from "@/components/Notice";
import { formatReadingDate } from "@/utils/readingDates";
import {
  createRecommendationSeeds,
  formatRecommendationReason,
  getRecommendationSeedKey,
  rankRecommendationCandidates,
  type RecommendationSearchGroup
} from "@/utils/recommendations";
import { getBookIdentityKey } from "@/utils/bookIdentity";
import {
  createEmptyRecommendationPreferences,
  type RecommendationPreferences,
  type RecommendationSignal
} from "@/utils/recommendationPreferences";

const RECOMMENDATION_PAGE_SIZE = 4;

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
  const [shelfReady, setShelfReady] = useState(false);
  const [error, setError] = useState("");
  const [recommendationGroups, setRecommendationGroups] = useState<
    RecommendationSearchGroup[]
  >([]);
  const [recommendationMessages, setRecommendationMessages] = useState<string[]>([]);
  const [recommendationFeedback, setRecommendationFeedback] = useState("");
  const [recommendationFeedbackTone, setRecommendationFeedbackTone] = useState<
    "success" | "error"
  >("success");
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [selectedRecommendationKey, setSelectedRecommendationKey] = useState("all");
  const [recommendationOffset, setRecommendationOffset] = useState(0);
  const [recommendationPreferences, setRecommendationPreferences] =
    useState<RecommendationPreferences>(createEmptyRecommendationPreferences());
  const dismissedBookKeys = recommendationPreferences.dismissedBookKeys;

  useEffect(() => {
    const loaded = localStorageBookshelfRepository.load();
    if (loaded.ok) {
      setData(loaded.value);
    } else {
      setError(loaded.error);
    }

    const loadedPreferences = localStorageRecommendationRepository.load();
    if (loadedPreferences.ok) {
      setRecommendationPreferences(loadedPreferences.value);
    } else {
      setRecommendationFeedback(loadedPreferences.error);
      setRecommendationFeedbackTone("error");
    }
    setShelfReady(true);
  }, []);

  const items = useMemo(() => getShelfItems(data), [data]);
  const summary = useMemo(() => createHomeSummary(items), [items]);
  const recommendationSeeds = useMemo(
    () => createRecommendationSeeds(items, 3, recommendationPreferences.feedback),
    [items, recommendationPreferences.feedback]
  );
  const recommendationSeed = recommendationSeeds[0];
  const selectedRecommendationSeed = recommendationSeeds.find(
    (seed) => getRecommendationSeedKey(seed) === selectedRecommendationKey
  );
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.userBook.registeredAt).getTime() -
        new Date(a.userBook.registeredAt).getTime()
    )
    .slice(0, 4);
  const recentCompletedItems = useMemo(() => getRecentCompletedItems(items), [items]);

  useEffect(() => {
    if (!shelfReady || recommendationSeeds.length === 0) {
      setRecommendationGroups([]);
      setRecommendationMessages([]);
      setRecommendationsLoading(false);
      return;
    }

    const controller = new AbortController();
    setRecommendationsLoading(true);
    setRecommendationMessages([]);

    async function loadRecommendations() {
      try {
        const settledResults = await Promise.allSettled(
          recommendationSeeds.map(async (seed) => {
            const params = new URLSearchParams({
              keyword: seed.value,
              source: "google",
              sort: "relevance"
            });
            const response = await fetch(`/api/books/search?${params.toString()}`, {
              signal: controller.signal
            });
            if (!response.ok) {
              throw new Error("recommendation-failed");
            }
            return {
              seed,
              result: (await response.json()) as BookSearchResult
            };
          })
        );
        if (controller.signal.aborted) {
          return;
        }

        const successfulResults = settledResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        );
        if (successfulResults.length === 0) {
          throw new Error("recommendation-failed");
        }
        let groups = successfulResults.map(({ seed, result }) => ({
          seed,
          books: result.books
        }));
        const messages = successfulResults.flatMap(({ result }) => result.messages);
        if (settledResults.some((result) => result.status === "rejected")) {
          messages.push(
            "一部のおすすめ条件を取得できませんでした。取得できた候補を表示しています。"
          );
        }

        const rankedCandidates = rankRecommendationCandidates(groups, items, {
          excludedBookKeys: dismissedBookKeys,
          limit: 1
        });
        const demoMode = successfulResults.some(({ result }) => result.demoMode);
        if (demoMode && rankedCandidates.length === 0) {
          const fallbackResponse = await fetch(
            "/api/books/search?source=google&sort=relevance",
            { signal: controller.signal }
          );
          if (fallbackResponse.ok) {
            const fallbackResult = (await fallbackResponse.json()) as BookSearchResult;
            groups = [{ seed: recommendationSeeds[0], books: fallbackResult.books }];
            messages.push(...fallbackResult.messages);
          }
        }

        setRecommendationGroups(groups);
        setRecommendationOffset(0);
        setRecommendationMessages(Array.from(new Set(messages)));
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setRecommendationGroups([]);
        setRecommendationMessages([
          "おすすめを取得できませんでした。時間をおいてもう一度お試しください。"
        ]);
      } finally {
        if (!controller.signal.aborted) {
          setRecommendationsLoading(false);
        }
      }
    }

    void loadRecommendations();

    return () => controller.abort();
  }, [dismissedBookKeys, items, recommendationSeeds, shelfReady]);

  useEffect(() => {
    if (
      selectedRecommendationKey !== "all" &&
      !recommendationSeeds.some(
        (seed) => getRecommendationSeedKey(seed) === selectedRecommendationKey
      )
    ) {
      setSelectedRecommendationKey("all");
    }
  }, [recommendationSeeds, selectedRecommendationKey]);

  const filteredRecommendationGroups = useMemo(
    () =>
      selectedRecommendationKey === "all"
        ? recommendationGroups
        : recommendationGroups.filter(
            ({ seed }) =>
              getRecommendationSeedKey(seed) === selectedRecommendationKey
          ),
    [recommendationGroups, selectedRecommendationKey]
  );
  const rankedRecommendations = useMemo(
    () =>
      rankRecommendationCandidates(filteredRecommendationGroups, items, {
        excludedBookKeys: dismissedBookKeys,
        feedback: recommendationPreferences.feedback,
        limit: 24
      }),
    [
      dismissedBookKeys,
      filteredRecommendationGroups,
      items,
      recommendationPreferences.feedback
    ]
  );

  const visibleRecommendations = rankedRecommendations.slice(
    recommendationOffset,
    recommendationOffset + RECOMMENDATION_PAGE_SIZE
  );

  function handleRecommendationMessage(message: string, tone: "success" | "error") {
    setRecommendationFeedback(message);
    setRecommendationFeedbackTone(tone);
    if (tone === "success") {
      const loaded = localStorageBookshelfRepository.load();
      if (loaded.ok) {
        setData(loaded.value);
      }
    }
  }

  function handleSelectSeed(key: string) {
    setSelectedRecommendationKey(key);
    setRecommendationOffset(0);
    setRecommendationFeedback("");
  }

  function handleNextRecommendations() {
    if (
      recommendationOffset + RECOMMENDATION_PAGE_SIZE <
      rankedRecommendations.length
    ) {
      setRecommendationOffset(recommendationOffset + RECOMMENDATION_PAGE_SIZE);
      return;
    }

    setRecommendationOffset(0);
  }

  function handleDismissRecommendation(book: Book) {
    const result = localStorageRecommendationRepository.dismiss(book);
    if (!result.ok) {
      setRecommendationFeedback(result.error);
      setRecommendationFeedbackTone("error");
      return;
    }

    setRecommendationPreferences(result.value);
    setRecommendationOffset(0);
    setRecommendationFeedback("この本を今後のおすすめから外しました。");
    setRecommendationFeedbackTone("success");
  }

  function handleRecommendationSignal(book: Book, signal: RecommendationSignal) {
    const bookKey = getBookIdentityKey(book);
    const currentSignal = recommendationPreferences.feedback.find(
      (item) => item.bookKey === bookKey
    )?.signal;
    const nextSignal = currentSignal === signal ? undefined : signal;
    const result = localStorageRecommendationRepository.setFeedback(
      book,
      nextSignal
    );
    if (!result.ok) {
      setRecommendationFeedback(result.error);
      setRecommendationFeedbackTone("error");
      return;
    }

    setRecommendationPreferences(result.value);
    setRecommendationOffset(0);
    setRecommendationFeedback(
      nextSignal === "interested"
        ? "「気になる」を学習しました。似た著者やジャンルを優先します。"
        : nextSignal === "notForMe"
          ? "「合わない」を学習しました。似た候補の順位を下げます。"
          : "この本への反応を取り消しました。"
    );
    setRecommendationFeedbackTone("success");
  }

  function handleResetDismissedRecommendations() {
    const result = localStorageRecommendationRepository.clearDismissed();
    if (!result.ok) {
      setRecommendationFeedback(result.error);
      setRecommendationFeedbackTone("error");
      return;
    }

    setRecommendationPreferences(result.value);
    setRecommendationOffset(0);
    setRecommendationFeedback("おすすめから外した本を、再び候補に含めます。");
    setRecommendationFeedbackTone("success");
  }

  function handleResetRecommendationFeedback() {
    const confirmed = window.confirm(
      "「気になる」「合わない」の学習履歴をすべて削除します。よろしいですか？"
    );
    if (!confirmed) {
      return;
    }

    const result = localStorageRecommendationRepository.clearFeedback();
    if (!result.ok) {
      setRecommendationFeedback(result.error);
      setRecommendationFeedbackTone("error");
      return;
    }

    setRecommendationPreferences(result.value);
    setRecommendationOffset(0);
    setRecommendationFeedback("おすすめの学習履歴をリセットしました。");
    setRecommendationFeedbackTone("success");
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
              <h2 className="font-bold">あなたへのおすすめ</h2>
              <p className="text-sm text-muted">
                {recommendationSeed ? recommendationSeed.value : "本棚から好みを見つけます"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            {recommendationSeed
              ? formatRecommendationReason(recommendationSeed)
              : "本棚に本を登録すると、ジャンルや著者をもとに候補を表示します。"}
          </p>
          <Link
            href={recommendationSeed ? "#recommendations" : "/search"}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sage hover:underline"
          >
            {recommendationSeed ? "おすすめを見る" : "本を探す"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
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

      <section id="recommendations" className="mt-10 scroll-mt-24">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">あなたへのおすすめ</h2>
            {recommendationSeed ? (
              <p className="mt-1 text-sm text-muted">
                {selectedRecommendationSeed
                  ? formatRecommendationReason(selectedRecommendationSeed)
                  : "本棚の読書状態と自分の評価をもとに、複数の条件から順位付けしました。"}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {rankedRecommendations.length > RECOMMENDATION_PAGE_SIZE ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleNextRecommendations}
              >
                <RefreshCw size={17} aria-hidden="true" />
                別の候補を見る
              </button>
            ) : null}
            <Link href="/search" className="text-sm font-semibold text-sage hover:underline">
              自分で探す
            </Link>
          </div>
        </div>

        {recommendationSeeds.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <SlidersHorizontal size={17} aria-hidden="true" />
              おすすめの基準
            </p>
            <div
              className="inline-flex max-w-full flex-wrap gap-1 rounded-md border border-line bg-white p-1"
              role="group"
              aria-label="おすすめの基準"
            >
              <button
                type="button"
                onClick={() => handleSelectSeed("all")}
                className={`min-h-9 rounded px-3 text-sm font-semibold transition ${
                  selectedRecommendationKey === "all"
                    ? "bg-sage text-white"
                    : "text-muted hover:bg-[#edf5ef] hover:text-ink"
                }`}
                aria-pressed={selectedRecommendationKey === "all"}
              >
                総合
              </button>
              {recommendationSeeds.map((seed) => {
                const seedKey = getRecommendationSeedKey(seed);
                return (
                  <button
                    key={seedKey}
                    type="button"
                    onClick={() => handleSelectSeed(seedKey)}
                    className={`min-h-9 rounded px-3 text-sm font-semibold transition ${
                      seedKey === selectedRecommendationKey
                        ? "bg-sage text-white"
                        : "text-muted hover:bg-[#edf5ef] hover:text-ink"
                    }`}
                    aria-pressed={seedKey === selectedRecommendationKey}
                  >
                    {seed.kind === "category"
                      ? `ジャンル: ${seed.value}`
                      : `著者: ${seed.value}`}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mb-4 grid gap-3">
          {recommendationFeedback ? (
            <Notice
              message={recommendationFeedback}
              tone={recommendationFeedbackTone}
            />
          ) : null}
          {recommendationMessages.map((message) => (
            <Notice key={message} message={message} />
          ))}
          {dismissedBookKeys.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <p>おすすめから外した本: {dismissedBookKeys.length}冊</p>
              <button
                type="button"
                onClick={handleResetDismissedRecommendations}
                className="inline-flex items-center gap-1 font-semibold text-sage hover:underline"
              >
                <Undo2 size={16} aria-hidden="true" />
                除外をリセット
              </button>
            </div>
          ) : null}
          {recommendationPreferences.feedback.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <p>
                学習した反応: {recommendationPreferences.feedback.length}冊
              </p>
              <button
                type="button"
                onClick={handleResetRecommendationFeedback}
                className="inline-flex items-center gap-1 font-semibold text-sage hover:underline"
              >
                <Undo2 size={16} aria-hidden="true" />
                学習をリセット
              </button>
            </div>
          ) : null}
        </div>

        {!shelfReady || recommendationsLoading ? (
          <div className="surface p-6 text-muted">おすすめを選んでいます。</div>
        ) : !recommendationSeed ? (
          <div className="surface p-6 text-muted">
            おすすめの条件にできる本がまだありません。本棚に本を追加すると、ここに候補が表示されます。
          </div>
        ) : visibleRecommendations.length === 0 ? (
          <div className="surface p-6 text-muted">
            今回は新しい候補が見つかりませんでした。本棚が増えるとおすすめも変わります。
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleRecommendations.map(({ book, reasons }) => {
              const bookKey = getBookIdentityKey(book);
              const signal = recommendationPreferences.feedback.find(
                (item) => item.bookKey === bookKey
              )?.signal;
              return (
                <BookCard
                  key={`${book.source}-${book.sourceId}`}
                  book={book}
                  onDismiss={handleDismissRecommendation}
                  onMessage={handleRecommendationMessage}
                  onRecommendationSignal={handleRecommendationSignal}
                  recommendationReasons={reasons}
                  recommendationSignal={signal}
                />
              );
            })}
          </div>
        )}
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
                      読了日: {formatReadingDate(completedDate)}
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

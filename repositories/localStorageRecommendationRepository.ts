"use client";

import type { Book } from "@/types/book";
import type { RepositoryResult } from "@/repositories/localStorageBookshelfRepository";
import { getBookIdentityKey } from "@/utils/bookIdentity";
import {
  createEmptyRecommendationPreferences,
  parseRecommendationPreferences,
  type RecommendationPreferences,
  type RecommendationSignal
} from "@/utils/recommendationPreferences";

const STORAGE_KEY = "book-compass-recommendation-preferences-v1";

export const localStorageRecommendationRepository = {
  load(): RepositoryResult<RecommendationPreferences> {
    if (typeof window === "undefined") {
      return { ok: true, value: createEmptyRecommendationPreferences() };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return {
        ok: true,
        value: raw
          ? parseRecommendationPreferences(raw)
          : createEmptyRecommendationPreferences()
      };
    } catch {
      return {
        ok: false,
        error:
          "おすすめの学習データを読み込めませんでした。ブラウザの保存設定をご確認ください。"
      };
    }
  },

  save(
    preferences: RecommendationPreferences
  ): RepositoryResult<RecommendationPreferences> {
    if (typeof window === "undefined") {
      return { ok: true, value: preferences };
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      return { ok: true, value: preferences };
    } catch {
      return {
        ok: false,
        error:
          "おすすめの学習データを保存できませんでした。ブラウザの保存設定をご確認ください。"
      };
    }
  },

  dismiss(book: Book): RepositoryResult<RecommendationPreferences> {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }

    const key = getBookIdentityKey(book);
    return this.save({
      ...loaded.value,
      dismissedBookKeys: Array.from(
        new Set([...loaded.value.dismissedBookKeys, key])
      )
    });
  },

  setFeedback(
    book: Book,
    signal?: RecommendationSignal
  ): RepositoryResult<RecommendationPreferences> {
    const loaded = this.load();
    if (!loaded.ok) {
      return loaded;
    }

    const bookKey = getBookIdentityKey(book);
    const otherFeedback = loaded.value.feedback.filter(
      (item) => item.bookKey !== bookKey
    );
    const feedback = signal
      ? [
          ...otherFeedback,
          {
            bookKey,
            bookTitle: book.title,
            signal,
            authors: book.authors,
            categories: book.categories,
            updatedAt: new Date().toISOString()
          }
        ].slice(-200)
      : otherFeedback;

    return this.save({
      ...loaded.value,
      feedback
    });
  },

  clearDismissed(): RepositoryResult<RecommendationPreferences> {
    const loaded = this.load();
    return loaded.ok
      ? this.save({ ...loaded.value, dismissedBookKeys: [] })
      : loaded;
  },

  clearFeedback(): RepositoryResult<RecommendationPreferences> {
    const loaded = this.load();
    return loaded.ok ? this.save({ ...loaded.value, feedback: [] }) : loaded;
  },

  clear(): RepositoryResult<RecommendationPreferences> {
    return this.save(createEmptyRecommendationPreferences());
  }
};

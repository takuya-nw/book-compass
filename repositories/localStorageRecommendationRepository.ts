"use client";

import type { Book } from "@/types/book";
import type { RepositoryResult } from "@/repositories/localStorageBookshelfRepository";
import { getBookIdentityKey } from "@/utils/bookIdentity";
import {
  createEmptyRecommendationPreferences,
  parseRecommendationPreferences,
  type RecommendationPreferences
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
          "おすすめの除外設定を読み込めませんでした。ブラウザの保存設定をご確認ください。"
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
          "おすすめの除外設定を保存できませんでした。ブラウザの保存設定をご確認ください。"
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
      version: 1,
      dismissedBookKeys: Array.from(
        new Set([...loaded.value.dismissedBookKeys, key])
      )
    });
  },

  clear(): RepositoryResult<RecommendationPreferences> {
    return this.save(createEmptyRecommendationPreferences());
  }
};

"use client";

import type { BookshelfData } from "@/types/book";
import type { RepositoryResult } from "@/repositories/localStorageBookshelfRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { localStorageRecommendationRepository } from "@/repositories/localStorageRecommendationRepository";
import {
  exportBookCompassBackup,
  parseBookCompassBackup
} from "@/utils/backup";
import {
  createEmptyRecommendationPreferences,
  type RecommendationPreferences
} from "@/utils/recommendationPreferences";

type RestoredBookCompassData = {
  bookshelf: BookshelfData;
  recommendationPreferences: RecommendationPreferences;
};

export const localStorageBackupRepository = {
  export(data: BookshelfData): RepositoryResult<string> {
    const preferences = localStorageRecommendationRepository.load();
    if (!preferences.ok) {
      return preferences;
    }

    return {
      ok: true,
      value: exportBookCompassBackup(data, preferences.value)
    };
  },

  restore(raw: string): RepositoryResult<RestoredBookCompassData> {
    try {
      const parsed = parseBookCompassBackup(raw);
      const currentBookshelf = localStorageBookshelfRepository.load();
      const currentPreferences = localStorageRecommendationRepository.load();
      const nextPreferences =
        parsed.recommendationPreferences ??
        (currentPreferences.ok
          ? currentPreferences.value
          : createEmptyRecommendationPreferences());

      const savedBookshelf = localStorageBookshelfRepository.replace(
        parsed.bookshelf
      );
      if (!savedBookshelf.ok) {
        return savedBookshelf;
      }

      if (parsed.recommendationPreferences) {
        const savedPreferences =
          localStorageRecommendationRepository.save(nextPreferences);
        if (!savedPreferences.ok) {
          if (currentBookshelf.ok) {
            localStorageBookshelfRepository.replace(currentBookshelf.value);
          }
          return savedPreferences;
        }
      }

      return {
        ok: true,
        value: {
          bookshelf: savedBookshelf.value,
          recommendationPreferences: nextPreferences
        }
      };
    } catch (restoreError) {
      return {
        ok: false,
        error:
          restoreError instanceof Error
            ? restoreError.message
            : "バックアップを読み込めませんでした。"
      };
    }
  }
};

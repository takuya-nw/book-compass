import { afterEach, describe, expect, it, vi } from "vitest";
import { localStorageRecommendationRepository } from "@/repositories/localStorageRecommendationRepository";
import type { Book } from "@/types/book";

const book: Book = {
  id: "feedback-book",
  isbn13: "9784000000030",
  title: "反応を記録する本",
  authors: ["山田太郎"],
  categories: ["教養"],
  source: "google",
  sourceId: "feedback-book"
};

function stubLocalStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localStorageおすすめリポジトリ", () => {
  it("反応を保存し、除外設定を維持できる", () => {
    stubLocalStorage();

    expect(localStorageRecommendationRepository.dismiss(book).ok).toBe(true);
    const feedback = localStorageRecommendationRepository.setFeedback(
      book,
      "interested"
    );

    expect(feedback.ok).toBe(true);
    if (feedback.ok) {
      expect(feedback.value.dismissedBookKeys).toEqual([
        "isbn:9784000000030"
      ]);
      expect(feedback.value.feedback[0]).toMatchObject({
        bookKey: "isbn:9784000000030",
        bookTitle: "反応を記録する本",
        signal: "interested",
        authors: ["山田太郎"],
        categories: ["教養"]
      });
    }
  });

  it("学習履歴と除外設定を個別にリセットできる", () => {
    stubLocalStorage();
    localStorageRecommendationRepository.dismiss(book);
    localStorageRecommendationRepository.setFeedback(book, "notForMe");

    const clearedFeedback = localStorageRecommendationRepository.clearFeedback();
    expect(clearedFeedback.ok && clearedFeedback.value.feedback).toEqual([]);
    expect(
      clearedFeedback.ok && clearedFeedback.value.dismissedBookKeys
    ).toHaveLength(1);

    const clearedDismissed =
      localStorageRecommendationRepository.clearDismissed();
    expect(
      clearedDismissed.ok && clearedDismissed.value.dismissedBookKeys
    ).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  createEmptyRecommendationPreferences,
  parseRecommendationPreferences
} from "@/utils/recommendationPreferences";

describe("おすすめ除外設定", () => {
  it("空の初期設定を作成できる", () => {
    expect(createEmptyRecommendationPreferences()).toEqual({
      version: 1,
      dismissedBookKeys: [],
      feedback: []
    });
  });

  it("旧形式を維持しながら重複した除外キーを整理できる", () => {
    expect(
      parseRecommendationPreferences(
        JSON.stringify({
          version: 1,
          dismissedBookKeys: ["isbn:1", "isbn:1", "isbn:2"]
        })
      )
    ).toEqual({
      version: 1,
      dismissedBookKeys: ["isbn:1", "isbn:2"],
      feedback: []
    });
  });

  it("おすすめへの反応を復元できる", () => {
    const feedback = {
      bookKey: "isbn:9784000000001",
      bookTitle: "学習する本",
      signal: "interested" as const,
      authors: ["山田太郎"],
      categories: ["教養"],
      updatedAt: "2026-07-16T00:00:00.000Z"
    };

    expect(
      parseRecommendationPreferences(
        JSON.stringify({
          version: 1,
          dismissedBookKeys: [],
          feedback: [feedback]
        })
      ).feedback
    ).toEqual([feedback]);
  });

  it("不正な設定を拒否する", () => {
    expect(() =>
      parseRecommendationPreferences(
        JSON.stringify({ version: 1, dismissedBookKeys: [123] })
      )
    ).toThrow("invalid-recommendation-preferences");

    expect(() =>
      parseRecommendationPreferences(
        JSON.stringify({
          version: 1,
          dismissedBookKeys: [],
          feedback: [{ signal: "interested" }]
        })
      )
    ).toThrow("invalid-recommendation-preferences");
  });
});

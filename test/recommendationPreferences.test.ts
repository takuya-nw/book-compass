import { describe, expect, it } from "vitest";
import {
  createEmptyRecommendationPreferences,
  parseRecommendationPreferences
} from "@/utils/recommendationPreferences";

describe("おすすめ除外設定", () => {
  it("空の初期設定を作成できる", () => {
    expect(createEmptyRecommendationPreferences()).toEqual({
      version: 1,
      dismissedBookKeys: []
    });
  });

  it("重複した除外キーを整理して復元できる", () => {
    expect(
      parseRecommendationPreferences(
        JSON.stringify({
          version: 1,
          dismissedBookKeys: ["isbn:1", "isbn:1", "isbn:2"]
        })
      )
    ).toEqual({
      version: 1,
      dismissedBookKeys: ["isbn:1", "isbn:2"]
    });
  });

  it("不正な設定を拒否する", () => {
    expect(() =>
      parseRecommendationPreferences(
        JSON.stringify({ version: 1, dismissedBookKeys: [123] })
      )
    ).toThrow("invalid-recommendation-preferences");
  });
});

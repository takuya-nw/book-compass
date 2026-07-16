import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecommendationSearchCache,
  getRecommendationSearchResult
} from "@/services/recommendationSearchService";
import type { BookSearchResult } from "@/types/book";
import type { RecommendationSeed } from "@/utils/recommendations";

const seed: RecommendationSeed = {
  kind: "category",
  value: "教養",
  basedOnTitles: ["本1"]
};

const result: BookSearchResult = {
  books: [],
  demoMode: false,
  messages: []
};

function successResponse() {
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

beforeEach(() => {
  clearRecommendationSearchCache();
});

describe("おすすめ検索キャッシュ", () => {
  it("同じ条件の同時リクエストを1回にまとめる", async () => {
    const fetcher = vi.fn(async () => successResponse());

    const [first, second] = await Promise.all([
      getRecommendationSearchResult(seed, { fetcher }),
      getRecommendationSearchResult(seed, { fetcher })
    ]);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(first).toEqual(result);
    expect(second).toEqual(result);
  });

  it("10分以内は結果を再利用し、期限後は再取得する", async () => {
    let currentTime = 1_000;
    const fetcher = vi.fn(async () => successResponse());
    const now = () => currentTime;

    await getRecommendationSearchResult(seed, { fetcher, now });
    currentTime += 9 * 60 * 1000;
    await getRecommendationSearchResult(seed, { fetcher, now });
    expect(fetcher).toHaveBeenCalledOnce();

    currentTime += 2 * 60 * 1000;
    await getRecommendationSearchResult(seed, { fetcher, now });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("異なる条件は個別に取得する", async () => {
    const fetcher = vi.fn<
      (input: RequestInfo | URL) => Promise<Response>
    >(async () => successResponse());
    const authorSeed: RecommendationSeed = {
      kind: "author",
      value: "山田太郎",
      basedOnTitles: ["本2"]
    };

    await getRecommendationSearchResult(seed, { fetcher });
    await getRecommendationSearchResult(authorSeed, { fetcher });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0][0])).toContain(
      encodeURIComponent("教養")
    );
    expect(String(fetcher.mock.calls[1][0])).toContain(
      encodeURIComponent("山田太郎")
    );
  });

  it("通信失敗はキャッシュせず次回に再試行する", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 500 }))
      .mockResolvedValueOnce(successResponse());

    await expect(
      getRecommendationSearchResult(seed, { fetcher })
    ).rejects.toThrow("recommendation-failed");
    await expect(
      getRecommendationSearchResult(seed, { fetcher })
    ).resolves.toEqual(result);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

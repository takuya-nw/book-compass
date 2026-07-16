"use client";

import type { BookSearchResult } from "@/types/book";
import {
  getRecommendationSeedKey,
  type RecommendationSeed
} from "@/utils/recommendations";

const CACHE_DURATION_MS = 10 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  result: BookSearchResult;
};

type RecommendationFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

type SearchOptions = {
  fetcher?: RecommendationFetch;
  now?: () => number;
};

const resultCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<BookSearchResult>>();

function createCacheKey(seed?: RecommendationSeed): string {
  return seed ? getRecommendationSeedKey(seed) : "fallback";
}

function createSearchUrl(seed?: RecommendationSeed): string {
  const params = new URLSearchParams({
    source: "google",
    sort: "relevance"
  });
  if (seed) {
    params.set("keyword", seed.value);
  }
  return `/api/books/search?${params.toString()}`;
}

export async function getRecommendationSearchResult(
  seed?: RecommendationSeed,
  options: SearchOptions = {}
): Promise<BookSearchResult> {
  const cacheKey = createCacheKey(seed);
  const now = options.now ?? Date.now;
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > now()) {
    return cached.result;
  }
  if (cached) {
    resultCache.delete(cacheKey);
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const fetcher = options.fetcher ?? fetch;
  const request = fetcher(createSearchUrl(seed))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("recommendation-failed");
      }
      const result = (await response.json()) as BookSearchResult;
      resultCache.set(cacheKey, {
        expiresAt: now() + CACHE_DURATION_MS,
        result
      });
      return result;
    })
    .finally(() => {
      if (pendingRequests.get(cacheKey) === request) {
        pendingRequests.delete(cacheKey);
      }
    });

  pendingRequests.set(cacheKey, request);
  return request;
}

export function clearRecommendationSearchCache() {
  resultCache.clear();
  pendingRequests.clear();
}

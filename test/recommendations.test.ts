import { describe, expect, it } from "vitest";
import type { Book, UserBook } from "@/types/book";
import {
  createRecommendationSeed,
  getRecommendationCandidates
} from "@/utils/recommendations";
import type { ShelfItem } from "@/utils/shelfView";

function createItem(
  id: string,
  options: {
    categories?: string[];
    authors?: string[];
    status?: UserBook["status"];
    rating?: number;
  } = {}
): ShelfItem {
  return {
    book: {
      id,
      title: `本${id}`,
      authors: options.authors ?? [],
      categories: options.categories ?? [],
      source: "mock",
      sourceId: id
    },
    userBook: {
      id: `user-${id}`,
      bookId: id,
      status: options.status ?? "wantToRead",
      personalRating: options.rating,
      registeredAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    }
  };
}

function createBook(id: string, isbn13?: string): Book {
  return {
    id,
    isbn13,
    title: `候補${id}`,
    authors: ["著者"],
    categories: [],
    source: "google",
    sourceId: id
  };
}

describe("おすすめ候補", () => {
  it("高評価の読了本と共通するジャンルを優先する", () => {
    const seed = createRecommendationSeed([
      createItem("1", { categories: ["心理学"], status: "completed", rating: 5 }),
      createItem("2", { categories: ["心理学"], status: "reading" }),
      createItem("3", { categories: ["経営"], status: "wantToRead" })
    ]);

    expect(seed).toEqual({ kind: "category", value: "心理学" });
  });

  it("ジャンルがない場合は著者を検索軸にする", () => {
    const seed = createRecommendationSeed([
      createItem("1", { authors: ["山田太郎"], status: "completed", rating: 4 })
    ]);

    expect(seed).toEqual({ kind: "author", value: "山田太郎" });
  });

  it("興味なしと低評価の本はおすすめ条件に使わない", () => {
    const seed = createRecommendationSeed([
      createItem("1", { categories: ["歴史"], status: "notInterested" }),
      createItem("2", { categories: ["小説"], status: "completed", rating: 2 })
    ]);

    expect(seed).toBeUndefined();
  });

  it("本棚にある本と重複候補を除外する", () => {
    const shelfBook = createBook("shelf", "9784000000001");
    const duplicate = createBook("duplicate", "9784000000001");
    const candidate = createBook("candidate", "9784000000002");

    expect(getRecommendationCandidates([duplicate, candidate, candidate], [shelfBook])).toEqual([
      candidate
    ]);
  });
});

import { describe, expect, it } from "vitest";
import type { Book, UserBook } from "@/types/book";
import {
  createRecommendationSeed,
  createRecommendationSeeds,
  getRecommendationCandidates,
  rankRecommendationCandidates
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

function createBook(id: string, options: string | Partial<Book> = {}): Book {
  const overrides = typeof options === "string" ? { isbn13: options } : options;
  return {
    id,
    title: `候補${id}`,
    authors: ["著者"],
    categories: [],
    source: "google",
    sourceId: id,
    ...overrides
  };
}

describe("おすすめ候補", () => {
  it("高評価の読了本と共通するジャンルを優先する", () => {
    const seed = createRecommendationSeed([
      createItem("1", { categories: ["心理学"], status: "completed", rating: 5 }),
      createItem("2", { categories: ["心理学"], status: "reading" }),
      createItem("3", { categories: ["経営"], status: "wantToRead" })
    ]);

    expect(seed).toEqual({
      kind: "category",
      value: "心理学",
      basedOnTitles: ["本1", "本2"]
    });
  });

  it("ジャンルがない場合は著者を検索軸にする", () => {
    const seed = createRecommendationSeed([
      createItem("1", { authors: ["山田太郎"], status: "completed", rating: 4 })
    ]);

    expect(seed).toEqual({
      kind: "author",
      value: "山田太郎",
      basedOnTitles: ["本1"]
    });
  });

  it("複数のおすすめ条件を優先順に取得できる", () => {
    const seeds = createRecommendationSeeds([
      createItem("1", {
        categories: ["心理学"],
        authors: ["山田太郎"],
        status: "completed",
        rating: 5
      }),
      createItem("2", { categories: ["教養"], status: "reading" })
    ]);

    expect(seeds.map(({ kind, value }) => ({ kind, value }))).toEqual([
      { kind: "category", value: "心理学" },
      { kind: "author", value: "山田太郎" },
      { kind: "category", value: "教養" }
    ]);
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

    expect(
      getRecommendationCandidates([duplicate, candidate, candidate], [shelfBook])
    ).toEqual([candidate]);
  });

  it("おすすめから外した本を候補に含めない", () => {
    const excluded = createBook("excluded", "9784000000003");
    const candidate = createBook("candidate", "9784000000004");

    expect(
      getRecommendationCandidates([excluded, candidate], [], {
        excludedBookKeys: ["isbn:9784000000003"]
      })
    ).toEqual([candidate]);
  });

  it("高評価した読了本と同じ著者の候補を上位にする", () => {
    const shelfItem = createItem("favorite", {
      authors: ["山田太郎"],
      categories: ["心理学"],
      status: "completed",
      rating: 5
    });
    const generic = createBook("generic", {
      authors: ["別の著者"],
      categories: ["心理学"]
    });
    const sameAuthor = createBook("same-author", {
      authors: ["山田太郎"],
      categories: []
    });

    const ranked = rankRecommendationCandidates(
      [
        {
          seed: {
            kind: "category",
            value: "心理学",
            basedOnTitles: ["本favorite"]
          },
          books: [generic, sameAuthor]
        }
      ],
      [shelfItem]
    );

    expect(ranked[0].book).toEqual(sameAuthor);
    expect(ranked[0].reasons).toContain(
      "「本favorite」と同じ著者（山田太郎）"
    );
  });

  it("低評価の本との一致は順位を押し上げない", () => {
    const lowRatedItem = createItem("low", {
      authors: ["山田太郎"],
      status: "completed",
      rating: 2
    });
    const firstResult = createBook("first", { authors: ["別の著者"] });
    const lowRatedMatch = createBook("match", { authors: ["山田太郎"] });

    const ranked = rankRecommendationCandidates(
      [
        {
          seed: {
            kind: "category",
            value: "教養",
            basedOnTitles: ["本low"]
          },
          books: [firstResult, lowRatedMatch]
        }
      ],
      [lowRatedItem]
    );

    expect(ranked[0].book).toEqual(firstResult);
    expect(ranked[1].reasons).toEqual(["ジャンル「教養」の検索候補"]);
  });

  it("順位への影響が大きい本をおすすめ理由でも優先する", () => {
    const wantToReadItem = createItem("later", {
      authors: ["山田太郎"],
      status: "wantToRead"
    });
    const favoriteItem = createItem("favorite", {
      authors: ["山田太郎"],
      status: "completed",
      rating: 5
    });
    const candidate = createBook("candidate", { authors: ["山田太郎"] });

    const [ranked] = rankRecommendationCandidates(
      [
        {
          seed: { kind: "author", value: "山田太郎", basedOnTitles: ["本favorite"] },
          books: [candidate]
        }
      ],
      [wantToReadItem, favoriteItem]
    );

    expect(ranked.reasons[0]).toBe(
      "「本favorite」と同じ著者（山田太郎）"
    );
  });

  it("複数の検索条件に出た同じISBNの本を統合する", () => {
    const first = createBook("first", "9784000000010");
    const duplicate = createBook("duplicate", "9784000000010");

    const ranked = rankRecommendationCandidates(
      [
        {
          seed: { kind: "category", value: "教養", basedOnTitles: ["本1"] },
          books: [first]
        },
        {
          seed: { kind: "author", value: "山田太郎", basedOnTitles: ["本1"] },
          books: [duplicate]
        }
      ],
      []
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].reasons).toEqual([
      "ジャンル「教養」の検索候補",
      "山田太郎さんの著書"
    ]);
  });
});

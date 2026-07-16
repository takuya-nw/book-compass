import type { Book } from "@/types/book";
import {
  areSameBook,
  getBookIdentityKey,
  normalizeText
} from "@/utils/bookIdentity";
import type { ShelfItem } from "@/utils/shelfView";

export type RecommendationSeed = {
  kind: "category" | "author";
  value: string;
  basedOnTitles: string[];
};

export type RecommendationSearchGroup = {
  seed: RecommendationSeed;
  books: Book[];
};

export type RankedRecommendation = {
  book: Book;
  score: number;
  reasons: string[];
};

type Candidate = RecommendationSeed & {
  score: number;
  count: number;
};

const statusWeights = {
  wantToRead: 1,
  reading: 3,
  completed: 4,
  notInterested: 0
} as const;

function getItemWeight(item: ShelfItem): number {
  const { personalRating, status } = item.userBook;
  if (status === "notInterested" || (personalRating && personalRating <= 2)) {
    return 0;
  }
  return statusWeights[status] + (personalRating ?? 0);
}

function addCandidate(
  candidates: Map<string, Candidate>,
  kind: RecommendationSeed["kind"],
  value: string,
  score: number,
  bookTitle: string
) {
  const trimmedValue = value.trim();
  const normalizedValue = normalizeText(trimmedValue);
  if (!normalizedValue) {
    return;
  }

  const key = `${kind}:${normalizedValue}`;
  const current = candidates.get(key);
  const basedOnTitles = current?.basedOnTitles ?? [];
  candidates.set(key, {
    kind,
    value: current?.value ?? trimmedValue,
    basedOnTitles: basedOnTitles.includes(bookTitle)
      ? basedOnTitles
      : [...basedOnTitles, bookTitle],
    score: (current?.score ?? 0) + score,
    count: (current?.count ?? 0) + 1
  });
}

export function createRecommendationSeeds(
  items: ShelfItem[],
  limit = 3
): RecommendationSeed[] {
  const candidates = new Map<string, Candidate>();

  items.forEach((item) => {
    const score = getItemWeight(item);
    if (score === 0) {
      return;
    }

    item.book.categories.forEach((category) =>
      addCandidate(candidates, "category", category, score, item.book.title)
    );
    item.book.authors.forEach((author) =>
      addCandidate(candidates, "author", author, score, item.book.title)
    );
  });

  return [...candidates.values()]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      if (a.kind !== b.kind) {
        return a.kind === "category" ? -1 : 1;
      }
      return a.value.localeCompare(b.value, "ja");
    })
    .slice(0, Math.max(0, limit))
    .map(({ kind, value, basedOnTitles }) => ({
      kind,
      value,
      basedOnTitles: basedOnTitles.slice(0, 2)
    }));
}

export function createRecommendationSeed(
  items: ShelfItem[]
): RecommendationSeed | undefined {
  return createRecommendationSeeds(items, 1)[0];
}

export function formatRecommendationReason(seed: RecommendationSeed): string {
  const basis =
    seed.basedOnTitles.length > 1
      ? `「${seed.basedOnTitles[0]}」などの本棚データ`
      : seed.basedOnTitles.length === 1
        ? `「${seed.basedOnTitles[0]}」の登録内容`
        : "本棚の登録内容";

  return seed.kind === "category"
    ? `${basis}から、ジャンル「${seed.value}」に近い本を選びました。`
    : `${basis}から、${seed.value}さんの本を選びました。`;
}

export function getRecommendationSeedKey(seed: RecommendationSeed): string {
  return `${seed.kind}:${normalizeText(seed.value)}`;
}

type RecommendationCandidateOptions = {
  excludedBookKeys?: string[];
  limit?: number;
};

export function getRecommendationCandidates(
  books: Book[],
  shelfBooks: Book[],
  options: RecommendationCandidateOptions = {}
): Book[] {
  const candidates: Book[] = [];
  const excludedBookKeys = new Set(options.excludedBookKeys ?? []);
  const limit = options.limit ?? 4;

  for (const book of books) {
    const existsOnShelf = shelfBooks.some((shelfBook) => areSameBook(shelfBook, book));
    const alreadyIncluded = candidates.some((candidate) => areSameBook(candidate, book));
    const isExcluded = excludedBookKeys.has(getBookIdentityKey(book));
    if (!existsOnShelf && !alreadyIncluded && !isExcluded) {
      candidates.push(book);
    }
    if (candidates.length >= limit) {
      break;
    }
  }

  return candidates;
}

type RankingOptions = {
  excludedBookKeys?: string[];
  limit?: number;
};

type RankingCandidate = {
  book: Book;
  score: number;
  personalReasons: Map<string, number>;
  searchReasons: Map<string, number>;
};

function createSearchReason(seed: RecommendationSeed): string {
  return seed.kind === "author"
    ? `${seed.value}さんの著書`
    : `ジャンル「${seed.value}」の検索候補`;
}

function toNormalizedSet(values: string[]): Set<string> {
  return new Set(values.map(normalizeText).filter(Boolean));
}

function addWeightedReason(
  reasons: Map<string, number>,
  reason: string,
  weight: number
) {
  reasons.set(reason, Math.max(reasons.get(reason) ?? 0, weight));
}

function addShelfAffinity(candidate: RankingCandidate, item: ShelfItem) {
  const itemWeight = getItemWeight(item);
  if (itemWeight === 0) {
    return;
  }

  const candidateAuthors = toNormalizedSet(candidate.book.authors);
  const matchingAuthor = item.book.authors.find((author) =>
    candidateAuthors.has(normalizeText(author))
  );
  if (matchingAuthor) {
    const authorScore = itemWeight * 4;
    candidate.score += authorScore;
    addWeightedReason(
      candidate.personalReasons,
      `「${item.book.title}」と同じ著者（${matchingAuthor}）`,
      authorScore
    );
  }

  const candidateCategories = toNormalizedSet(candidate.book.categories);
  const matchingCategories = item.book.categories.filter((category) =>
    candidateCategories.has(normalizeText(category))
  );
  if (matchingCategories.length > 0) {
    const categoryScore = itemWeight * 2 * Math.min(matchingCategories.length, 2);
    candidate.score += categoryScore;
    addWeightedReason(
      candidate.personalReasons,
      `「${item.book.title}」と同じ「${matchingCategories[0]}」ジャンル`,
      categoryScore
    );
  }
}

export function rankRecommendationCandidates(
  groups: RecommendationSearchGroup[],
  shelfItems: ShelfItem[],
  options: RankingOptions = {}
): RankedRecommendation[] {
  const excludedBookKeys = new Set(options.excludedBookKeys ?? []);
  const shelfBooks = shelfItems.map((item) => item.book);
  const candidates = new Map<string, RankingCandidate>();

  groups.forEach((group, groupIndex) => {
    const seedPriority = Math.max(1, groups.length - groupIndex) * 6;

    group.books.forEach((book, bookIndex) => {
      const identityKey = getBookIdentityKey(book);
      if (
        excludedBookKeys.has(identityKey) ||
        shelfBooks.some((shelfBook) => areSameBook(shelfBook, book))
      ) {
        return;
      }

      const candidate = candidates.get(identityKey) ?? {
        book,
        score: 0,
        personalReasons: new Map<string, number>(),
        searchReasons: new Map<string, number>()
      };
      const resultPositionScore = Math.max(0.5, (10 - bookIndex) * 0.4);
      const searchScore = seedPriority + resultPositionScore;
      candidate.score += searchScore;
      addWeightedReason(
        candidate.searchReasons,
        createSearchReason(group.seed),
        searchScore
      );
      candidates.set(identityKey, candidate);
    });
  });

  candidates.forEach((candidate) => {
    shelfItems.forEach((item) => addShelfAffinity(candidate, item));

    if (
      candidate.book.reviewAverage !== undefined &&
      candidate.book.reviewCount !== undefined &&
      candidate.book.reviewCount > 0
    ) {
      candidate.score += Math.min(
        3,
        candidate.book.reviewAverage * Math.log10(candidate.book.reviewCount + 1) * 0.35
      );
    }
  });

  return [...candidates.values()]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if ((b.book.reviewAverage ?? 0) !== (a.book.reviewAverage ?? 0)) {
        return (b.book.reviewAverage ?? 0) - (a.book.reviewAverage ?? 0);
      }
      if ((b.book.reviewCount ?? 0) !== (a.book.reviewCount ?? 0)) {
        return (b.book.reviewCount ?? 0) - (a.book.reviewCount ?? 0);
      }
      return a.book.title.localeCompare(b.book.title, "ja");
    })
    .slice(0, options.limit ?? 24)
    .map(({ book, score, personalReasons, searchReasons }) => {
      const sortedPersonalReasons = [...personalReasons]
        .sort(([, aWeight], [, bWeight]) => bWeight - aWeight)
        .map(([reason]) => reason);
      const sortedSearchReasons = [...searchReasons]
        .sort(([, aWeight], [, bWeight]) => bWeight - aWeight)
        .map(([reason]) => reason);

      return {
        book,
        score,
        reasons: [...sortedPersonalReasons, ...sortedSearchReasons].slice(0, 2)
      };
    });
}

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

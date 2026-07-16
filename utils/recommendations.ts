import type { Book } from "@/types/book";
import { areSameBook, normalizeText } from "@/utils/bookIdentity";
import type { ShelfItem } from "@/utils/shelfView";

export type RecommendationSeed = {
  kind: "category" | "author";
  value: string;
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
  score: number
) {
  const trimmedValue = value.trim();
  const normalizedValue = normalizeText(trimmedValue);
  if (!normalizedValue) {
    return;
  }

  const key = `${kind}:${normalizedValue}`;
  const current = candidates.get(key);
  candidates.set(key, {
    kind,
    value: current?.value ?? trimmedValue,
    score: (current?.score ?? 0) + score,
    count: (current?.count ?? 0) + 1
  });
}

export function createRecommendationSeed(
  items: ShelfItem[]
): RecommendationSeed | undefined {
  const candidates = new Map<string, Candidate>();

  items.forEach((item) => {
    const score = getItemWeight(item);
    if (score === 0) {
      return;
    }

    item.book.categories.forEach((category) =>
      addCandidate(candidates, "category", category, score)
    );
    item.book.authors.forEach((author) =>
      addCandidate(candidates, "author", author, score)
    );
  });

  const [best] = [...candidates.values()].sort((a, b) => {
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
  });

  return best ? { kind: best.kind, value: best.value } : undefined;
}

export function formatRecommendationReason(seed: RecommendationSeed): string {
  return seed.kind === "category"
    ? `本棚の「${seed.value}」に近い本を選びました。`
    : `本棚にある${seed.value}さんの本から選びました。`;
}

export function getRecommendationCandidates(
  books: Book[],
  shelfBooks: Book[],
  limit = 4
): Book[] {
  const candidates: Book[] = [];

  for (const book of books) {
    const existsOnShelf = shelfBooks.some((shelfBook) => areSameBook(shelfBook, book));
    const alreadyIncluded = candidates.some((candidate) => areSameBook(candidate, book));
    if (!existsOnShelf && !alreadyIncluded) {
      candidates.push(book);
    }
    if (candidates.length >= limit) {
      break;
    }
  }

  return candidates;
}

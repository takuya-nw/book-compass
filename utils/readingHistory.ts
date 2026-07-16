import type { ShelfItem } from "@/utils/shelfView";

export type ReadingHistorySummary = {
  year: number;
  monthlyCounts: number[];
  completedItems: ShelfItem[];
  undatedItems: ShelfItem[];
  ratedCount: number;
  averageRating?: number;
};

function getValidDate(timestamp?: string): Date | undefined {
  if (!timestamp) {
    return undefined;
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getAvailableHistoryYears(
  items: ShelfItem[],
  currentYear = new Date().getFullYear()
): number[] {
  const years = new Set<number>([currentYear]);

  items.forEach(({ userBook }) => {
    if (userBook.status !== "completed") {
      return;
    }
    const finishedDate = getValidDate(userBook.finishedAt);
    if (finishedDate) {
      years.add(finishedDate.getFullYear());
    }
  });

  return [...years].sort((a, b) => b - a);
}

export function createReadingHistory(
  items: ShelfItem[],
  year: number
): ReadingHistorySummary {
  const monthlyCounts = Array.from({ length: 12 }, () => 0);
  const completedItems: ShelfItem[] = [];
  const undatedItems: ShelfItem[] = [];

  items
    .filter(({ userBook }) => userBook.status === "completed")
    .forEach((item) => {
      const finishedDate = getValidDate(item.userBook.finishedAt);
      if (!finishedDate) {
        undatedItems.push(item);
        return;
      }
      if (finishedDate.getFullYear() !== year) {
        return;
      }
      monthlyCounts[finishedDate.getMonth()] += 1;
      completedItems.push(item);
    });

  completedItems.sort(
    (a, b) =>
      new Date(b.userBook.finishedAt ?? 0).getTime() -
      new Date(a.userBook.finishedAt ?? 0).getTime()
  );
  undatedItems.sort(
    (a, b) =>
      new Date(b.userBook.updatedAt).getTime() -
      new Date(a.userBook.updatedAt).getTime()
  );

  const ratings = completedItems
    .map(({ userBook }) => userBook.personalRating)
    .filter((rating): rating is number => typeof rating === "number");

  return {
    year,
    monthlyCounts,
    completedItems,
    undatedItems,
    ratedCount: ratings.length,
    averageRating:
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) /
          10
        : undefined
  };
}

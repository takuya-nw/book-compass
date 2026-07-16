import type { ReadingStatus } from "@/types/book";
import type { ShelfItem } from "@/utils/shelfView";

export type HomeSummary = Record<ReadingStatus, number> & {
  rated: number;
};

export function createHomeSummary(items: ShelfItem[]): HomeSummary {
  return items.reduce<HomeSummary>(
    (summary, { userBook }) => {
      summary[userBook.status] += 1;
      if (typeof userBook.personalRating === "number") {
        summary.rated += 1;
      }
      return summary;
    },
    {
      wantToRead: 0,
      reading: 0,
      completed: 0,
      notInterested: 0,
      rated: 0
    }
  );
}

export function getRecentCompletedItems(
  items: ShelfItem[],
  limit = 3
): ShelfItem[] {
  return items
    .filter(({ userBook }) => userBook.status === "completed")
    .sort((a, b) => {
      const aDate = a.userBook.finishedAt ?? a.userBook.updatedAt;
      const bDate = b.userBook.finishedAt ?? b.userBook.updatedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, limit);
}

import type { ReadingStatus } from "@/types/book";
import { statusLabels } from "@/utils/formatters";

const statusClass: Record<ReadingStatus, string> = {
  wantToRead: "border-gold/30 bg-[#fff6db] text-[#725407]",
  reading: "border-sage/30 bg-[#edf5ef] text-[#315447]",
  completed: "border-clay/30 bg-[#fff0eb] text-[#7d3929]",
  notInterested: "border-muted/30 bg-[#f1eee8] text-[#554f46]"
};

export function StatusBadge({ status }: { status: ReadingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

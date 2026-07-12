"use client";

import type { ReadingStatus } from "@/types/book";
import { statusLabels } from "@/utils/formatters";

const statuses: ReadingStatus[] = [
  "wantToRead",
  "reading",
  "completed",
  "notInterested"
];

type StatusControlsProps = {
  currentStatus?: ReadingStatus;
  onChange: (status: ReadingStatus) => void;
};

export function StatusControls({ currentStatus, onChange }: StatusControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          className={currentStatus === status ? "btn-primary" : "btn-secondary"}
          onClick={() => onChange(status)}
        >
          {statusLabels[status]}
        </button>
      ))}
    </div>
  );
}

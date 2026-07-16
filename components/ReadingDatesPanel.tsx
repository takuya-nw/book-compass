"use client";

import { CalendarCheck2, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Notice } from "@/components/Notice";
import type { UserBook } from "@/types/book";
import {
  dateInputToTimestamp,
  toDateInputValue,
  validateReadingDateOrder,
  type ReadingDates
} from "@/utils/readingDates";

type ReadingDatesPanelProps = {
  userBook: UserBook;
  onSave: (dates: ReadingDates) => void;
};

export function ReadingDatesPanel({ userBook, onSave }: ReadingDatesPanelProps) {
  const startedInputId = useId();
  const finishedInputId = useId();
  const [startedDate, setStartedDate] = useState(toDateInputValue(userBook.startedAt));
  const [finishedDate, setFinishedDate] = useState(toDateInputValue(userBook.finishedAt));
  const [error, setError] = useState("");

  useEffect(() => {
    setStartedDate(toDateInputValue(userBook.startedAt));
    setFinishedDate(toDateInputValue(userBook.finishedAt));
  }, [userBook.startedAt, userBook.finishedAt]);

  function saveDates() {
    const validationError = validateReadingDateOrder(startedDate, finishedDate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    onSave({
      startedAt: dateInputToTimestamp(startedDate),
      finishedAt: dateInputToTimestamp(finishedDate)
    });
  }

  return (
    <section className="mt-6 border-t border-line pt-6">
      <h2 className="text-lg font-bold">読書日付</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="label" htmlFor={startedInputId}>
            読み始めた日
          </label>
          <div className="grid grid-cols-[1fr_44px] gap-2">
            <input
              id={startedInputId}
              type="date"
              className="input"
              value={startedDate}
              onChange={(event) => setStartedDate(event.target.value)}
            />
            <button
              type="button"
              className="btn-secondary w-11 px-0"
              disabled={!startedDate}
              onClick={() => setStartedDate("")}
              aria-label="読み始めた日を消去"
              title="読み始めた日を消去"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="label" htmlFor={finishedInputId}>
            読み終えた日
          </label>
          <div className="grid grid-cols-[1fr_44px] gap-2">
            <input
              id={finishedInputId}
              type="date"
              className="input"
              value={finishedDate}
              onChange={(event) => setFinishedDate(event.target.value)}
            />
            <button
              type="button"
              className="btn-secondary w-11 px-0"
              disabled={!finishedDate}
              onClick={() => setFinishedDate("")}
              aria-label="読み終えた日を消去"
              title="読み終えた日を消去"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {error ? <Notice message={error} tone="error" /> : null}
        <button
          type="button"
          className="btn-primary justify-self-start"
          onClick={saveDates}
        >
          <CalendarCheck2 size={18} aria-hidden="true" />
          日付を保存
        </button>
      </div>
    </section>
  );
}

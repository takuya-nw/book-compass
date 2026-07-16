"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserBook } from "@/types/book";

type PersonalReviewPanelProps = {
  userBook?: UserBook;
  disabled?: boolean;
  onSave: (review: { personalRating?: number; personalNote?: string }) => void;
};

export function PersonalReviewPanel({
  userBook,
  disabled = false,
  onSave
}: PersonalReviewPanelProps) {
  const [rating, setRating] = useState<number | undefined>(userBook?.personalRating);
  const [note, setNote] = useState(userBook?.personalNote ?? "");

  useEffect(() => {
    setRating(userBook?.personalRating);
    setNote(userBook?.personalNote ?? "");
  }, [userBook?.personalRating, userBook?.personalNote]);

  return (
    <section className="mt-6 border-t border-line pt-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold">自分の読後メモ</h2>
        <p className="mt-1 text-sm text-muted">
          評価とメモは自分の本棚だけに保存されます。
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <span className="label">自分の評価</span>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={rating === value ? "btn-primary px-3" : "btn-secondary px-3"}
                disabled={disabled}
                onClick={() => setRating(value)}
                title={`${value}点`}
              >
                <Star
                  size={18}
                  aria-hidden="true"
                  fill={rating && value <= rating ? "currentColor" : "none"}
                />
                {value}
              </button>
            ))}
            <button
              type="button"
              className="btn-secondary px-3"
              disabled={disabled || rating === undefined}
              onClick={() => setRating(undefined)}
            >
              未評価
            </button>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="label">メモ</span>
          <textarea
            className="input min-h-28 resize-y"
            value={note}
            disabled={disabled}
            onChange={(event) => setNote(event.target.value)}
            placeholder="読んだ感想、覚えておきたいこと、あとで見返したい一文など"
            maxLength={1000}
          />
        </label>

        <button
          type="button"
          className="btn-primary justify-self-start"
          disabled={disabled}
          onClick={() => onSave({ personalRating: rating, personalNote: note })}
        >
          読後メモを保存
        </button>
      </div>
    </section>
  );
}

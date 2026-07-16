export type ReadingDates = {
  startedAt?: string;
  finishedAt?: string;
};

export function toDateInputValue(timestamp?: string): string {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateInputToTimestamp(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date.toISOString();
}

export function validateReadingDateOrder(
  startedDate: string,
  finishedDate: string
): string | undefined {
  if (startedDate && finishedDate && finishedDate < startedDate) {
    return "読み終えた日は、読み始めた日以降に設定してください。";
  }
  return undefined;
}

export function formatReadingDate(timestamp?: string): string {
  if (!timestamp) {
    return "未設定";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

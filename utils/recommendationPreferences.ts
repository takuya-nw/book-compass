export type RecommendationSignal = "interested" | "notForMe";

export type RecommendationFeedback = {
  bookKey: string;
  bookTitle: string;
  signal: RecommendationSignal;
  authors: string[];
  categories: string[];
  updatedAt: string;
};

export type RecommendationPreferences = {
  version: 1;
  dismissedBookKeys: string[];
  feedback: RecommendationFeedback[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFeedback(value: unknown): value is RecommendationFeedback {
  return (
    isRecord(value) &&
    isNonEmptyString(value.bookKey) &&
    isNonEmptyString(value.bookTitle) &&
    (value.signal === "interested" || value.signal === "notForMe") &&
    isStringArray(value.authors) &&
    isStringArray(value.categories) &&
    isNonEmptyString(value.updatedAt) &&
    !Number.isNaN(Date.parse(value.updatedAt))
  );
}

export function createEmptyRecommendationPreferences(): RecommendationPreferences {
  return {
    version: 1,
    dismissedBookKeys: [],
    feedback: []
  };
}

export function parseRecommendationPreferencesValue(
  value: unknown
): RecommendationPreferences {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.dismissedBookKeys) ||
    !value.dismissedBookKeys.every(isNonEmptyString) ||
    (value.feedback !== undefined &&
      (!Array.isArray(value.feedback) || !value.feedback.every(isFeedback)))
  ) {
    throw new Error("invalid-recommendation-preferences");
  }

  const feedbackByBook = new Map<string, RecommendationFeedback>();
  (value.feedback ?? []).forEach((item) => feedbackByBook.set(item.bookKey, item));

  return {
    version: 1,
    dismissedBookKeys: Array.from(new Set(value.dismissedBookKeys)),
    feedback: [...feedbackByBook.values()]
  };
}

export function parseRecommendationPreferences(
  raw: string
): RecommendationPreferences {
  return parseRecommendationPreferencesValue(JSON.parse(raw) as unknown);
}

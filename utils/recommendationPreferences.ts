export type RecommendationPreferences = {
  version: 1;
  dismissedBookKeys: string[];
};

export function createEmptyRecommendationPreferences(): RecommendationPreferences {
  return {
    version: 1,
    dismissedBookKeys: []
  };
}

export function parseRecommendationPreferences(
  raw: string
): RecommendationPreferences {
  const value = JSON.parse(raw) as unknown;
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("dismissedBookKeys" in value) ||
    !Array.isArray(value.dismissedBookKeys) ||
    !value.dismissedBookKeys.every(
      (key) => typeof key === "string" && key.trim().length > 0
    )
  ) {
    throw new Error("invalid-recommendation-preferences");
  }

  return {
    version: 1,
    dismissedBookKeys: Array.from(new Set(value.dismissedBookKeys))
  };
}

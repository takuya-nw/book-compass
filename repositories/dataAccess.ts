import { localStorageBackupRepository } from "@/repositories/localStorageBackupRepository";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import { localStorageRecommendationRepository } from "@/repositories/localStorageRecommendationRepository";
import {
  getSupabaseBrowserClient,
  type SupabaseClientResult
} from "@/services/supabase/client";

export type DataAccessMode = "localStorage" | "supabase";

export type LocalStorageDataAccess = {
  mode: "localStorage";
  bookshelf: typeof localStorageBookshelfRepository;
  recommendations: typeof localStorageRecommendationRepository;
  backup: typeof localStorageBackupRepository;
};

export type SupabaseDataAccess = {
  mode: "supabase";
  connection: SupabaseClientResult;
};

export type BookCompassDataAccess =
  | LocalStorageDataAccess
  | SupabaseDataAccess;

export function resolveDataAccessMode(value?: string): DataAccessMode {
  return value === "supabase" ? "supabase" : "localStorage";
}

export function createDataAccess(
  mode: DataAccessMode = resolveDataAccessMode(
    process.env.NEXT_PUBLIC_BOOK_COMPASS_DATA_SOURCE
  ),
  getSupabaseConnection: () => SupabaseClientResult = getSupabaseBrowserClient
): BookCompassDataAccess {
  if (mode === "supabase") {
    return {
      mode,
      connection: getSupabaseConnection()
    };
  }

  return {
    mode: "localStorage",
    bookshelf: localStorageBookshelfRepository,
    recommendations: localStorageRecommendationRepository,
    backup: localStorageBackupRepository
  };
}

export const dataAccess = createDataAccess();

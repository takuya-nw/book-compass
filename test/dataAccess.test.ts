import { describe, expect, it } from "vitest";
import {
  createDataAccess,
  resolveDataAccessMode
} from "@/repositories/dataAccess";
import { resolveSupabasePublicConfig } from "@/services/supabase/config";

describe("データアクセス設定", () => {
  it("未設定や不明な値ではlocalStorageを選ぶ", () => {
    expect(resolveDataAccessMode()).toBe("localStorage");
    expect(resolveDataAccessMode("unknown")).toBe("localStorage");

    const access = createDataAccess("localStorage");
    expect(access.mode).toBe("localStorage");
    if (access.mode === "localStorage") {
      expect(typeof access.bookshelf.load).toBe("function");
      expect(typeof access.recommendations.load).toBe("function");
      expect(typeof access.backup.export).toBe("function");
    }
  });

  it("Supabase接続情報の不足を安全に判定する", () => {
    expect(resolveSupabasePublicConfig({})).toEqual({
      configured: false,
      missing: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      ]
    });

    const access = createDataAccess("supabase", () => ({
      ok: false,
      error: "Supabaseの接続情報がまだ設定されていません。"
    }));
    expect(access.mode).toBe("supabase");
    if (access.mode === "supabase") {
      expect(access.connection).toEqual({
        ok: false,
        error: "Supabaseの接続情報がまだ設定されていません。"
      });
    }
  });

  it("URLとPublishable Keyが揃った場合だけ接続可能とする", () => {
    expect(
      resolveSupabasePublicConfig({
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_example"
      })
    ).toEqual({
      configured: true,
      value: {
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_example"
      }
    });
  });
});

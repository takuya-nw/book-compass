import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("環境変数の安全性", () => {
  it("Google Books APIキーを公開環境変数にしない", () => {
    const envExample = readProjectFile(".env.example");
    const googleService = readProjectFile("services/googleBooksService.ts");

    expect(envExample).toContain("GOOGLE_BOOKS_API_KEY=");
    expect(envExample).not.toContain("NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY");
    expect(googleService).toContain("process.env.GOOGLE_BOOKS_API_KEY");
    expect(googleService).not.toContain('"use client"');
  });

  it("SupabaseのSecret Keyをサンプルや接続コードで扱わない", () => {
    const envExample = readProjectFile(".env.example");
    const supabaseClient = readProjectFile("services/supabase/client.ts");

    expect(envExample).not.toMatch(/SUPABASE_(SECRET|SERVICE_ROLE)/);
    expect(supabaseClient).not.toMatch(/SUPABASE_(SECRET|SERVICE_ROLE)/);
  });
});

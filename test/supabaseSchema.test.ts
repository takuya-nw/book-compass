import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const schemaPath = fileURLToPath(
  new URL(
    "../supabase/migrations/202607160001_initial_book_compass_schema.sql",
    import.meta.url
  )
);
const schema = readFileSync(schemaPath, "utf8");

describe("Supabase初期スキーマ", () => {
  it.each(["books", "user_books", "recommendation_preferences"])(
    "%sにRLSと本人限定ポリシーを用意する",
    (table) => {
      expect(schema).toContain(`create table public.${table}`);
      expect(schema).toContain(
        `alter table public.${table} enable row level security`
      );
      expect(schema).toMatch(
        new RegExp(`on public\\.${table}[\\s\\S]*?auth\\.uid\\(\\).*?user_id`)
      );
    }
  );

  it("更新日時トリガーを3テーブルに設定する", () => {
    expect(schema.match(/execute function public\.set_book_compass_updated_at\(\)/g))
      .toHaveLength(3);
  });

  it("匿名利用者へテーブル権限を与えない", () => {
    expect(schema.match(/revoke all on table public\./g)).toHaveLength(3);
    expect(schema).not.toMatch(/grant .* on table public\..* to anon/i);
  });
});

import { NextResponse } from "next/server";
import { mockBooks } from "@/mock/books";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const book = mockBooks.find((item) => item.id === decodeURIComponent(id));

  if (!book) {
    return NextResponse.json(
      {
        message:
          "この本の詳細を直接取得できませんでした。検索結果または本棚からもう一度開いてください。"
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ book });
}

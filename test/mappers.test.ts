import { describe, expect, it } from "vitest";
import { mapGoogleResponseToBooks } from "@/services/mappers/googleBooksMapper";
import { mapRakutenResponseToBooks } from "@/services/mappers/rakutenMapper";

describe("API response mappers", () => {
  it("楽天APIレスポンスをBook型へ変換する", () => {
    const books = mapRakutenResponseToBooks({
      Items: [
        {
          Item: {
            title: "テストの本",
            subTitle: "副題",
            author: "山田 太郎／佐藤 花子",
            publisherName: "テスト出版",
            salesDate: "2026年7月",
            isbn: "9781234567897",
            itemPrice: 1500,
            mediumImageUrl: "https://example.com/cover.jpg?_ex=120x120",
            largeImageUrl: "https://example.com/cover-large.jpg?_ex=200x200",
            itemUrl: "https://example.com/book",
            reviewAverage: "4.5",
            reviewCount: 20,
            booksGenreId: "001"
          }
        }
      ]
    });

    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({
      title: "テストの本",
      subtitle: "副題",
      authors: ["山田 太郎", "佐藤 花子"],
      publisher: "テスト出版",
      isbn13: "9781234567897",
      price: 1500,
      reviewAverage: 4.5,
      reviewCount: 20,
      source: "rakuten"
    });
  });

  it("Google Books APIレスポンスをBook型へ変換する", () => {
    const books = mapGoogleResponseToBooks({
      items: [
        {
          id: "google-id",
          volumeInfo: {
            title: "Googleの本",
            subtitle: "補完検索",
            authors: ["鈴木 一郎"],
            publisher: "Google出版",
            publishedDate: "2025-05-01",
            description: "説明文",
            industryIdentifiers: [
              { type: "ISBN_10", identifier: "123456789X" },
              { type: "ISBN_13", identifier: "9781234567897" }
            ],
            imageLinks: {
              thumbnail: "http://example.com/thumb.jpg"
            },
            categories: ["技術"],
            infoLink: "https://example.com/info"
          },
          saleInfo: {
            listPrice: {
              amount: 2200,
              currencyCode: "JPY"
            }
          }
        }
      ]
    });

    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({
      id: "google-google-id",
      title: "Googleの本",
      authors: ["鈴木 一郎"],
      isbn10: "123456789X",
      isbn13: "9781234567897",
      price: 2200,
      currency: "JPY",
      thumbnailUrl: "https://example.com/thumb.jpg",
      source: "google"
    });
  });
});

import type { Book } from "@/types/book";

export const mockBooks: Book[] = [
  {
    id: "mock-9784004319015",
    isbn13: "9784004319015",
    title: "読書する人だけがたどり着ける場所",
    subtitle: "考える力を育てる本との付き合い方",
    authors: ["齋藤 孝"],
    publisher: "岩波書店",
    publishedDate: "2019-01-22",
    description:
      "本を読むことで得られる思考の深まりや、日々の生活で読書を続けるための視点を紹介する一冊です。",
    price: 902,
    currency: "JPY",
    thumbnailUrl: "/placeholder-cover.svg",
    largeImageUrl: "/placeholder-cover.svg",
    categories: ["読書", "教養"],
    reviewAverage: 4.1,
    reviewCount: 128,
    productUrl: "https://books.rakuten.co.jp/",
    source: "mock",
    sourceId: "demo-1"
  },
  {
    id: "mock-9784480689641",
    isbn13: "9784480689641",
    title: "本を読む本",
    subtitle: "読書の技法",
    authors: ["M・J・アドラー", "C・V・ドーレン"],
    publisher: "講談社",
    publishedDate: "1997-10-09",
    description:
      "読む目的に合わせて本と向き合うための古典的ガイド。これから読書習慣を整えたい人にも向いています。",
    price: 1320,
    currency: "JPY",
    thumbnailUrl: "/placeholder-cover.svg",
    largeImageUrl: "/placeholder-cover.svg",
    categories: ["読書法", "学習"],
    reviewAverage: 4.3,
    reviewCount: 92,
    productUrl: "https://books.rakuten.co.jp/",
    source: "mock",
    sourceId: "demo-2"
  },
  {
    id: "mock-no-isbn",
    title: "小さな本棚のつくり方",
    authors: ["Book Compass 編集部"],
    publisher: "Compass Books",
    publishedDate: "2026-04-01",
    description:
      "読みたい本、読みかけの本、読み終えた本を無理なく整理するためのデモ用サンプルです。",
    price: 0,
    currency: "JPY",
    thumbnailUrl: "/placeholder-cover.svg",
    largeImageUrl: "/placeholder-cover.svg",
    categories: ["暮らし", "読書管理"],
    reviewAverage: 4,
    reviewCount: 12,
    source: "mock",
    sourceId: "demo-3"
  }
];

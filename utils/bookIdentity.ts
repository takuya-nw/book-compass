import type { Book } from "@/types/book";

export function normalizeIsbn(value?: string): string | undefined {
  const normalized = value?.replace(/[^0-9Xx]/g, "").toUpperCase();
  return normalized || undefined;
}

export function normalizeText(value?: string): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[「」『』【】（）()［\]\[\].,、。・:：;；!！?？-]/g, "")
    .trim();
}

export function getPrimaryIsbn(book: Pick<Book, "isbn10" | "isbn13">): string | undefined {
  return normalizeIsbn(book.isbn13) ?? normalizeIsbn(book.isbn10);
}

export function getFallbackIdentity(book: Pick<Book, "title" | "authors" | "publisher">): string {
  const author = normalizeText(book.authors?.[0]);
  return [normalizeText(book.title), author, normalizeText(book.publisher)].join("|");
}

export function getBookIdentityKey(book: Book): string {
  const isbn = getPrimaryIsbn(book);
  return isbn ? `isbn:${isbn}` : `text:${getFallbackIdentity(book)}`;
}

export function areSameBook(a: Book, b: Book): boolean {
  const aIsbn = getPrimaryIsbn(a);
  const bIsbn = getPrimaryIsbn(b);

  if (aIsbn && bIsbn) {
    return aIsbn === bIsbn;
  }

  if (aIsbn || bIsbn) {
    return false;
  }

  return getFallbackIdentity(a) === getFallbackIdentity(b);
}

export function mergeDuplicateBooks(books: Book[]): Book[] {
  const merged: Book[] = [];

  for (const book of books) {
    const duplicateIndex = merged.findIndex((candidate) => areSameBook(candidate, book));
    if (duplicateIndex === -1) {
      merged.push(book);
      continue;
    }

    const current = merged[duplicateIndex];
    if (current.source !== "rakuten" && book.source === "rakuten") {
      merged[duplicateIndex] = book;
    }
  }

  return merged;
}

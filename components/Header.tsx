import Link from "next/link";
import { BarChart3, BookOpen, Library, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="flex size-9 items-center justify-center rounded-md bg-sage text-white">
            <BookOpen size={20} aria-hidden="true" />
          </span>
          Book Compass
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/search" className="btn-secondary px-3" title="本を探す">
            <Search size={18} aria-hidden="true" />
            <span className="hidden sm:inline">本を探す</span>
          </Link>
          <Link href="/shelf" className="btn-secondary px-3" title="マイ本棚">
            <Library size={18} aria-hidden="true" />
            <span className="hidden sm:inline">マイ本棚</span>
          </Link>
          <Link href="/history" className="btn-secondary px-3" title="読書記録">
            <BarChart3 size={18} aria-hidden="true" />
            <span className="hidden md:inline">読書記録</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

type BookCoverProps = {
  src?: string;
  title: string;
  size?: "small" | "large";
};

export function BookCover({ src, title, size = "small" }: BookCoverProps) {
  const dimensions =
    size === "large"
      ? "h-[320px] w-[220px] sm:h-[380px] sm:w-[260px]"
      : "h-[190px] w-[128px]";

  return (
    <div className={`${dimensions} shrink-0 overflow-hidden rounded-md border border-line bg-[#efe6d5] shadow-sm`}>
      {/* Google Books cover images can be served from multiple remote hosts. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/placeholder-cover.svg"}
        alt={`${title}の表紙`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

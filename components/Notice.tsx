type NoticeProps = {
  message: string;
  tone?: "info" | "error" | "success";
};

const toneClass = {
  info: "border-sage/30 bg-[#edf5ef] text-[#315447]",
  error: "border-clay/30 bg-[#fff0eb] text-[#7d3929]",
  success: "border-gold/30 bg-[#fff8df] text-[#725407]"
};

export function Notice({ message, tone = "info" }: NoticeProps) {
  return (
    <p className={`rounded-md border px-4 py-3 text-sm font-medium ${toneClass[tone]}`}>
      {message}
    </p>
  );
}

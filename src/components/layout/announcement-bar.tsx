import { FREE_SHIPPING_THRESHOLD } from "@/lib/format";

const MESSAGES = [
  `Free shipping on orders over $${FREE_SHIPPING_THRESHOLD}`,
  "30-day free returns & exchanges",
  "The Winter Edit — now live",
  "Try it on virtually before you buy",
];

export function AnnouncementBar() {
  const row = (hidden?: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {MESSAGES.map((m) => (
        <li key={m} className="flex items-center gap-10 pr-10">
          <span>{m}</span>
          <span aria-hidden className="size-1 rounded-full bg-lime" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="eyebrow overflow-hidden bg-ink py-2.5 text-paper/90">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
        {row()}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}

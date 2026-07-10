import { FiHeart } from "react-icons/fi";
import { ThoughtOfTheDayQuote } from "./ThoughtOfTheDayQuote";

const TORN_PAPER_CLIP =
  "polygon(0% 4%, 3% 0%, 8% 3%, 14% 0%, 22% 4%, 30% 1%, 38% 4%, 46% 0%, 54% 3%, 62% 0%, 70% 4%, 78% 1%, 86% 4%, 94% 0%, 100% 3%, 100% 96%, 97% 100%, 90% 97%, 82% 100%, 74% 96%, 66% 100%, 58% 97%, 50% 100%, 42% 96%, 34% 100%, 26% 97%, 18% 100%, 10% 96%, 4% 100%, 0% 97%)";

type ThoughtOfTheDayCardProps = {
  text: string;
  className?: string;
  /** `hero` — anchored to the home hero panel; `inline` — flows below page content. */
  placement?: "hero" | "inline";
  liked?: boolean;
  likeBusy?: boolean;
  onToggleLike?: () => void;
};

export function ThoughtOfTheDayCard({
  text,
  className = "",
  placement = "hero",
  liked = false,
  likeBusy = false,
  onToggleLike,
}: ThoughtOfTheDayCardProps) {
  const interactive = Boolean(onToggleLike);
  const wrapperClass =
    placement === "inline"
      ? `${interactive ? "pointer-events-auto" : "pointer-events-none"} relative z-10 mt-6 flex w-full justify-center px-6`
      : `${interactive ? "pointer-events-auto" : "pointer-events-none"} absolute inset-x-0 bottom-[16%] z-10 flex justify-center px-6 sm:bottom-[18%]`;

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div
        className="relative max-w-lg rotate-[-1.5deg] border border-gray-200/80 bg-white/95 px-8 py-5 shadow-lg"
        style={{ clipPath: TORN_PAPER_CLIP }}
      >
        {onToggleLike ? (
          <button
            type="button"
            onClick={onToggleLike}
            disabled={likeBusy}
            aria-pressed={liked}
            aria-label={liked ? "Unlike today's tip" : "Like today's tip"}
            className="absolute right-4 top-3 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 disabled:opacity-50"
          >
            <FiHeart
              size={18}
              className={liked ? "fill-red-500 text-red-500" : undefined}
              aria-hidden
            />
          </button>
        ) : null}
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-ad-purple">
          Today&apos;s Tip
        </p>
        <ThoughtOfTheDayQuote text={text} />
      </div>
    </div>
  );
}

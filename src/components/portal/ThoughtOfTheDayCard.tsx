import { ThoughtOfTheDayQuote } from "./ThoughtOfTheDayQuote";

const TORN_PAPER_CLIP =
  "polygon(0% 4%, 3% 0%, 8% 3%, 14% 0%, 22% 4%, 30% 1%, 38% 4%, 46% 0%, 54% 3%, 62% 0%, 70% 4%, 78% 1%, 86% 4%, 94% 0%, 100% 3%, 100% 96%, 97% 100%, 90% 97%, 82% 100%, 74% 96%, 66% 100%, 58% 97%, 50% 100%, 42% 96%, 34% 100%, 26% 97%, 18% 100%, 10% 96%, 4% 100%, 0% 97%)";

type ThoughtOfTheDayCardProps = {
  text: string;
  className?: string;
};

export function ThoughtOfTheDayCard({ text, className = "" }: ThoughtOfTheDayCardProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-[16%] z-10 flex justify-center px-6 sm:bottom-[18%] ${className}`}
    >
      <div
        className="max-w-lg rotate-[-1.5deg] border border-gray-200/80 bg-white/95 px-8 py-5 shadow-lg"
        style={{ clipPath: TORN_PAPER_CLIP }}
      >
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-ad-purple">
          Today&apos;s Tip
        </p>
        <ThoughtOfTheDayQuote text={text} />
      </div>
    </div>
  );
}

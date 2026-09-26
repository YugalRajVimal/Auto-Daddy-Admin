import type { ReactNode } from "react";

/** Live previews shown beside the content forms (Thought of the Day, FAQs, Privacy, …). */

export function PreviewHeading({ children }: { children: ReactNode }) {
  return <h3 className="mb-4 text-center text-2xl font-bold text-gray-900 underline">{children}</h3>;
}

/** Thought-of-the-day card: attached image (or soft placeholder) with the quote on a green banner. */
export function TipPreview({
  imageUrl,
  text,
  title,
}: {
  imageUrl?: string | null;
  text: string;
  /** Shown in the top-left corner; falls back to "Thought of the day" until a title is typed. */
  title?: string;
}) {
  return (
    <div className="relative -m-5 aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#86b5bd] to-[#a8ccd1] sm:-m-8">
      {imageUrl ? (
        <img src={imageUrl} alt="Thought of the day" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <span className="absolute left-3 top-3 max-w-[60%] break-words font-serif text-sm uppercase tracking-wide text-gray-800">
        {title?.trim() || "Thought of the day"}
      </span>
      <div className="absolute right-0 top-[18%] w-[58%] bg-[#3a9660] px-5 py-4 text-right text-white sm:px-7 sm:py-5">
        <p className="text-lg leading-snug sm:text-2xl">
          {text.trim() || "Your thought of the day appears here as you type."}
        </p>
      </div>
    </div>
  );
}

/** FAQ card: question box over answer box, matching the "Add Frequent asked Question" mockup. */
export function FaqPreview({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="mx-auto mt-6 w-full max-w-[1000px]">
      <div className="min-h-[110px] rounded-t-xl border border-gray-400 bg-white px-4 py-3 text-base text-gray-900">
        {question.trim() || <span className="text-gray-400">Question</span>}
      </div>
      <div className="min-h-[110px] rounded-b-xl border border-t-0 border-gray-400 bg-[#f3f3f3] px-4 py-3 text-base text-gray-900">
        {answer.trim() || <span className="text-gray-400">Answer</span>}
      </div>
    </div>
  );
}

/** Privacy / disclaimer document preview. */
export function PolicyPreview({
  title,
  updated,
  module,
  body,
}: {
  title: string;
  updated: string;
  module: string;
  body: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1000px] text-center">
      <h3 className="text-2xl font-bold text-gray-900 underline">{title || "Privacy Policy"}</h3>
      <p className="mt-2 text-base text-gray-900">Date Updated : {updated || "—"}</p>
      {module ? (
        <p className="mx-auto mt-3 inline-block bg-gray-200 px-5 py-2 text-base text-gray-900">{module}</p>
      ) : null}
      <div className="mt-6 whitespace-pre-wrap break-words text-left text-base text-gray-900">
        {body.trim() || <span className="text-gray-400">Policy text appears here as you type.</span>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

export function ThoughtOfTheDayQuote({ text }: { text: string }) {
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    setCharIndex(0);
  }, [text]);

  useEffect(() => {
    if (charIndex >= text.length) return;

    const timer = window.setTimeout(() => setCharIndex((index) => index + 1), 42);
    return () => window.clearTimeout(timer);
  }, [charIndex, text]);

  const isComplete = charIndex >= text.length;

  return (
    <p className="text-center font-serif text-lg italic leading-relaxed text-gray-800 md:text-xl">
      {text.slice(0, charIndex)}
      {!isComplete ? (
        <span className="ml-0.5 inline-block animate-pulse text-ad-purple" aria-hidden>
          |
        </span>
      ) : null}
    </p>
  );
}

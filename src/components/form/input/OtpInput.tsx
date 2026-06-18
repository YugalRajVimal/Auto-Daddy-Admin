import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  className = "",
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputsRef.current[index]?.focus();
      inputsRef.current[index]?.select();
    }
  };

  const setDigitAt = (index: number, digit: string) => {
    const chars = Array.from({ length }, (_, i) => value[i] ?? "");
    chars[index] = digit;
    onChange(chars.join("").replace(/\s+$/, ""));
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;

    if (digits.length > 1) {
      const pasted = (value.slice(0, index) + digits).slice(0, length);
      onChange(pasted);
      focusInput(Math.min(pasted.length, length - 1));
      return;
    }

    setDigitAt(index, digits);
    if (index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        setDigitAt(index - 1, "");
        focusInput(index - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      className={`flex w-full justify-center gap-1.5 sm:gap-2 ${className}`}
      role="group"
      aria-label="One-time password"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[index] ?? ""}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="aspect-square h-10 w-full max-w-9 rounded-md border border-gray-400 bg-white text-center text-base font-semibold focus:border-ad-green focus:outline-none focus:ring-1 focus:ring-ad-green disabled:opacity-60 sm:h-12 sm:max-w-11 sm:text-lg"
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

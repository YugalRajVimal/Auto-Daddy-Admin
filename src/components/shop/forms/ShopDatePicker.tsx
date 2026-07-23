import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { shopCompactInputClass } from "../shopLayoutStyles";
import { CalenderIcon } from "../../../icons";

function startOfTomorrow(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

function parseYmd(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type ShopDatePickerProps = {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
  /** Only dates after today are selectable. Default true. */
  futureOnly?: boolean;
  placeholder?: string;
};

export default function ShopDatePicker({
  id,
  value,
  disabled,
  onChange,
  className = "",
  futureOnly = true,
  placeholder = "Select date",
}: ShopDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const minDate = futureOnly ? startOfTomorrow() : undefined;
    const parsed = parseYmd(value);
    const picker = flatpickr(input, {
      dateFormat: "Y-m-d",
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      minDate,
      defaultDate: parsed ?? undefined,
      onChange: (_selectedDates, dateStr) => {
        if (dateStr) onChangeRef.current(dateStr);
      },
    });
    pickerRef.current = picker;

    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
  }, [id, futureOnly]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const parsed = parseYmd(value);
    if (parsed) picker.setDate(parsed, false);
    else picker.clear();
  }, [value]);

  useEffect(() => {
    const input = pickerRef.current?.input;
    if (!input) return;
    input.disabled = Boolean(disabled);
  }, [disabled]);

  return (
    <div className={`relative min-w-0 ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={value}
        className={`${shopCompactInputClass} w-full cursor-pointer pr-8 disabled:cursor-not-allowed disabled:bg-gray-100`}
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-500">
        <CalenderIcon className="size-4" />
      </span>
    </div>
  );
}

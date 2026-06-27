import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { shopCompactInputClass } from "../shopLayoutStyles";
import { CalenderIcon } from "../../../icons";

function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
  return date;
}

type OpenHoursTimePickerProps = {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export default function OpenHoursTimePicker({
  id,
  value,
  disabled,
  onChange,
  className = "",
}: OpenHoursTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const picker = flatpickr(input, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      minuteIncrement: 30,
      defaultDate: timeStringToDate(value),
      onChange: (_selectedDates, dateStr) => {
        if (dateStr) onChangeRef.current(dateStr);
      },
    });
    pickerRef.current = picker;

    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    pickerRef.current?.setDate(timeStringToDate(value), false);
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
        defaultValue={value}
        className={`${shopCompactInputClass} w-full cursor-pointer pr-8 disabled:cursor-not-allowed disabled:bg-gray-100`}
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-500">
        <CalenderIcon className="size-4" />
      </span>
    </div>
  );
}

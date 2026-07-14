import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CompactField, compactInputClass } from "./ContentPanel";

type ComboSelectWithEditorProps = {
  label: string;
  required?: boolean;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
  onEditAddNew?: () => void;
  className?: string;
  inputClassName?: string;
  editButtonClassName?: string;
  activeItemClassName?: string;
};

export default function ComboSelectWithEditor({
  label,
  required,
  value,
  disabled = false,
  placeholder,
  options,
  onChange,
  onEditAddNew,
  className = "min-w-0 w-full",
  inputClassName = compactInputClass,
  editButtonClassName = "block w-full border-b-2 border-ad-green-dark bg-ad-green px-2 py-2 text-left text-sm font-bold tracking-wide text-white shadow-inner hover:bg-ad-green-dark",
  activeItemClassName = "bg-ad-green-light/60 font-semibold text-ad-green-dark",
}: ComboSelectWithEditorProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 208;
    const gap = 2;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    let top = rect.bottom + gap;
    if (spaceBelow < Math.min(menuHeight, 160) && spaceAbove > spaceBelow) {
      top = Math.max(gap, rect.top - menuHeight - gap);
    }

    setMenuStyle({
      top,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    updatePosition();
    const raf = requestAnimationFrame(() => updatePosition());
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, options.length, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayValue = value || placeholder || "Select";

  const menu =
    open && !disabled && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 10000,
            }}
            className="max-h-52 overflow-hidden rounded border border-gray-400 bg-white shadow-lg"
          >
            {onEditAddNew ? (
              <button
                type="button"
                onClick={() => {
                  onEditAddNew();
                  setOpen(false);
                }}
                className={editButtonClassName}
              >
                + Edit / Add New
              </button>
            ) : null}
            <div className="max-h-40 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                  !value ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500"
                }`}
              >
                {placeholder ?? "Select"}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={opt === value}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    opt === value ? activeItemClassName : "text-gray-900"
                  }`}
                >
                  {opt}
                </button>
              ))}
              {value && !options.includes(value) && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`block w-full px-2 py-1.5 text-left text-sm ${activeItemClassName}`}
                >
                  {value}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <CompactField label={label} required={required} className={className}>
      <div ref={rootRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((prev) => {
              const next = !prev;
              if (next) updatePosition();
              return next;
            });
          }}
          className={`${inputClassName} flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-gray-100 ${
            value ? "text-gray-900" : "text-gray-500"
          }`}
        >
          <span className="truncate">{displayValue}</span>
          <span className="ml-2 shrink-0 text-[10px] text-gray-500">{open ? "▲" : "▼"}</span>
        </button>
        {menu}
      </div>
    </CompactField>
  );
}

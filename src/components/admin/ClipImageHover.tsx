import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiPaperclip } from "react-icons/fi";

const CLIP_IMAGE_TOOLTIP_HEIGHT_PX = 120;
const CLIP_IMAGE_TOOLTIP_WIDTH_PX = 180;
const CLIP_IMAGE_TOOLTIP_GAP_PX = 4;

export const adminClipImageUrl = (seed: string | number) =>
  `https://picsum.photos/seed/admin-clip-${seed}/480/320`;

type ClipImageHoverProps = {
  imageUrl: string;
  alt: string;
  size?: number;
  iconClassName?: string;
  triggerClassName?: string;
};

export default function ClipImageHover({
  imageUrl,
  alt,
  size = 16,
  iconClassName = "text-ad-green",
  triggerClassName = "",
}: ClipImageHoverProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: Math.max(
        8,
        rect.top - CLIP_IMAGE_TOOLTIP_HEIGHT_PX - CLIP_IMAGE_TOOLTIP_GAP_PX
      ),
      left: rect.left + rect.width / 2,
    });
  }, []);

  const showTooltip = () => {
    updatePosition();
    setOpen(true);
  };

  const hideTooltip = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`inline-flex cursor-default items-center justify-center rounded p-1 hover:bg-gray-100 ${triggerClassName}`}
        aria-label={alt}
        tabIndex={0}
      >
        <FiPaperclip className={iconClassName} size={size} aria-hidden />
      </span>
      {open
        ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10000] -translate-x-1/2"
            style={{ top: coords.top, left: coords.left }}
          >
            <div
              className="flex items-center justify-center overflow-hidden rounded border border-gray-300 bg-white shadow-lg"
              style={{
                height: CLIP_IMAGE_TOOLTIP_HEIGHT_PX,
                width: CLIP_IMAGE_TOOLTIP_WIDTH_PX,
              }}
            >
              <img src={imageUrl} alt={alt} className="h-full w-full object-contain" />
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  );
}

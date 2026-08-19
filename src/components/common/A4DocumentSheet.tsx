import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** A4 at 96dpi — matches CSS `210mm` / `297mm` for layout math. */
export const A4_WIDTH_PX = (210 * 96) / 25.4;
export const A4_HEIGHT_PX = (297 * 96) / 25.4;

const STAGE_PAD_PX = 16;

const STAGE_CLASS =
  "a4-document-stage relative flex w-full min-h-[min(100%,72vh)] flex-1 justify-center overflow-auto bg-[#cfcfcf] px-2 py-3 sm:px-3 sm:py-4 print:min-h-0 print:bg-transparent print:p-0 print:overflow-visible";

const SHEET_BASE_CLASS =
  "a4-document-sheet relative box-border flex w-[210mm] min-h-[297mm] flex-col bg-white shadow-[0_10px_36px_rgba(0,0,0,0.18)] print:w-full print:min-h-0 print:shadow-none print:!transform-none";

type A4DocumentSheetProps = {
  children: ReactNode;
  /** Printed root id (e.g. shop-job-card-estimate-print). */
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Extra classes on the gray desk/stage around the paper. */
  stageClassName?: string;
  /**
   * contain — scale to fit width and height (default).
   * width — scale to available width only so taller invoices can scroll.
   */
  fit?: "contain" | "width";
};

/**
 * Renders children on an on-screen A4 sheet (210×297mm).
 * Scales to fill the available stage (width + height) while keeping A4 ratio.
 */
export default function A4DocumentSheet({
  children,
  id,
  className = "",
  style,
  stageClassName = "",
  fit = "contain",
}: A4DocumentSheetProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX);

  useEffect(() => {
    const stage = stageRef.current;
    const sheet = sheetRef.current;
    if (!stage || !sheet) return;

    const update = () => {
      const availableW = Math.max(0, stage.clientWidth - STAGE_PAD_PX * 2);
      const availableH = Math.max(0, stage.clientHeight - STAGE_PAD_PX * 2);
      const contentH = Math.max(sheet.scrollHeight, A4_HEIGHT_PX);

      const scaleW = availableW > 0 ? availableW / A4_WIDTH_PX : 1;
      let nextScale = scaleW;
      if (fit !== "width") {
        // Prefer filling width; if the stage has a real height, also fit height (contain).
        const scaleH =
          availableH > A4_HEIGHT_PX * 0.35 ? availableH / contentH : scaleW;
        nextScale = Math.min(scaleW, scaleH);
      }
      nextScale = Math.max(0.35, nextScale);

      setScale(nextScale);
      setSheetHeight(contentH);
    };

    update();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(stage);
    ro.observe(sheet);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [fit]);

  const scaledW = A4_WIDTH_PX * scale;
  const scaledH = sheetHeight * scale;

  const scalerStyle: CSSProperties = {
    width: scaledW,
    height: scaledH,
    marginInline: "auto",
    flexShrink: 0,
  };

  return (
    <div ref={stageRef} className={`${STAGE_CLASS} ${stageClassName}`.trim()}>
      <div className="a4-document-scaler print:contents" style={scalerStyle}>
        <div
          ref={sheetRef}
          id={id}
          className={`${SHEET_BASE_CLASS} ${className}`.trim()}
          style={{
            ...style,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

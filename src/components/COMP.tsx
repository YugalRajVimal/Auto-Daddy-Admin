import type { ReactNode } from "react";
import { PanelBottomBorder } from "./admin/ContentPanel";

const DASHBOARD_PANEL_SHADOW_HEIGHT = 14;

type DashboardPanelCardProps = {
  children: ReactNode;
  className?: string;
  /** Green/yellow shop form panel — used for job card create/edit */
  variant?: "default" | "form";
};

const DashboardPanelCard = ({
  children,
  className = "",
  variant = "default",
}: DashboardPanelCardProps) => {
  const isForm = variant === "form";

  return (
    <div
      className={`relative w-full shadow-sm ${isForm
          ? "rounded border border-ad-form-border bg-ad-form-bg px-4 py-4 md:px-5 md:py-5"
          : "rounded-lg border border-gray-200 bg-white px-3.5 py-2.5"
        } ${className}`}
      style={{
        zIndex: 50,
        marginBottom: DASHBOARD_PANEL_SHADOW_HEIGHT,
      }}
    >
      {children}
      <PanelBottomBorder height={DASHBOARD_PANEL_SHADOW_HEIGHT} />
    </div>
  );
};

export default DashboardPanelCard;

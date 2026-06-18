import { PanelBottomBorder, PANEL_BOTTOM_BORDER_HEIGHT } from "./admin/ContentPanel";

const DashboardPanelCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`relative w-full ${className}`}
      style={{
        background: "white",
        borderRadius: 8,
        padding: "10px 14px",
        border: `1px solid #e5e7eb`,
        zIndex: 50,
        marginBottom: PANEL_BOTTOM_BORDER_HEIGHT,
      }}
    >
      {children}
      <PanelBottomBorder />
    </div>
  );
};

export default DashboardPanelCard;

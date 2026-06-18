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
            }}
        >
            {children}
            <div
                className="absolute left-0 w-[100%] mx-auto h-[14px] bottom-[-14px] z-20"
                style={{ pointerEvents: "none", overflow: "hidden" }}
            >
                <svg
                    width="95%"
                    height="8"
                    viewBox="0 0 400 20"
                    preserveAspectRatio="none"
                    style={{ display: "block" }}
                    className="mx-auto"
                >
                    <path d="M0,20 Q200,-18 400,20 L400,0 L0,0 Z" fill="silver" />
                </svg>
            </div>
        </div>
    );
};

export default DashboardPanelCard;

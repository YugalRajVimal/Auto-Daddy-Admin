import type { ServiceCategory, ServiceSubItem } from "../../lib/serviceCatalog";
import { shopMainContentFillClass, shopMainContentShellClass } from "../shop/shopLayoutStyles";

function PanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 bg-ad-purple px-4 py-2.5">
      <div className="min-w-0 flex-1 text-center text-sm font-bold text-white">{title}</div>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
        >
          Back
        </button>
      ) : null}
    </div>
  );
}

function TileButton({
  label,
  onClick,
  muted = false,
}: {
  label: string;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[120px] w-full flex-col items-center justify-end rounded border px-3 py-4 text-center shadow-sm transition-all hover:shadow-md ${
        muted ? "border-gray-300 bg-gray-200" : "border-gray-300 bg-white"
      }`}
    >
      <span className={`font-serif text-base font-bold ${muted ? "text-gray-800" : "text-ad-green"}`}>
        {label}
      </span>
    </button>
  );
}

export default function OwnerServiceTilesPanel({
  indoor,
  outdoor,
  selectedService,
  onServiceSelect,
  onCloseService,
  onSubServiceSelect,
}: {
  indoor: ServiceCategory[];
  outdoor: ServiceCategory[];
  selectedService: ServiceCategory | null;
  onServiceSelect: (service: ServiceCategory) => void;
  onCloseService: () => void;
  onSubServiceSelect?: (sub: ServiceSubItem) => void;
}) {
  const allServices = [...indoor, ...outdoor];

  if (!selectedService) {
    return (
      <div className={`${shopMainContentShellClass} ${shopMainContentFillClass} bg-white`}>
        <PanelHeader title="Dashboard" />
        <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-3">
          {allServices.map((service) => {
            const key = service.id ?? service.name;
            return (
              <TileButton
                key={key}
                label={service.name}
                onClick={() => onServiceSelect(service)}
                muted={false}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const subs = selectedService.subServices ?? [];
  const title = selectedService.name.trim() || "Service";

  return (
    <div className={`${shopMainContentShellClass} ${shopMainContentFillClass} bg-white`}>
      <PanelHeader title={title} onBack={onCloseService} />
      {subs.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center p-6 text-center text-sm text-gray-600">
          No sub services available.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
          {subs.map((sub) => {
            const key = sub.id ?? sub.name;
            return (
              <TileButton
                key={key}
                label={sub.name}
                onClick={() => onSubServiceSelect?.(sub)}
                muted={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}


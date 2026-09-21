import type { ServiceCategory, ServiceSubItem } from "../../lib/serviceCatalog";
import { OwnerTitleBar } from "./ownerUi";

/** Alternating mockup tile tones: pale green and lime. */
const TILE_TONES = [
  "bg-[#d4fcd4] text-[#0a6b0a] ring-green-200",
  "bg-gradient-to-br from-[#a8d63a] to-[#8cc21f] text-white ring-lime-400",
  "bg-gradient-to-br from-[#a8d63a] to-[#8cc21f] text-white ring-lime-400",
  "bg-[#d4fcd4] text-[#0a6b0a] ring-green-200",
];

function TileButton({ label, tone, onClick }: { label: string; tone: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex aspect-square w-full flex-col items-center justify-end rounded-xl p-4 text-center shadow-sm ring-1 transition-all hover:-translate-y-1 hover:shadow-lg ${tone}`}
    >
      <span className="font-serif text-lg font-bold italic leading-tight drop-shadow-sm">{label}</span>
    </button>
  );
}

/** Home → service category: 2-column grid of sub-service tiles (mockup Safety / Tires screens). */
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
  const index = selectedService
    ? allServices.findIndex((s) => (s.id ?? s.name) === (selectedService.id ?? selectedService.name))
    : -1;
  const next = index >= 0 && allServices.length > 1 ? allServices[(index + 1) % allServices.length] : null;

  const tiles = selectedService ? selectedService.subServices ?? [] : [];
  const title = selectedService ? selectedService.name.trim() || "Service" : "Services";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <OwnerTitleBar
        title={title}
        onPrev={onCloseService}
        onNext={next ? () => onServiceSelect(next) : undefined}
      />
      {!selectedService ? (
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-6 p-8">
          {allServices.map((service, i) => (
            <TileButton
              key={service.id ?? service.name}
              label={service.name}
              tone={TILE_TONES[i % TILE_TONES.length]}
              onClick={() => onServiceSelect(service)}
            />
          ))}
        </div>
      ) : tiles.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center p-6 text-center text-sm text-gray-600">
          No sub services available.
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className={`grid w-full gap-6 ${tiles.length > 4 ? "max-w-2xl grid-cols-2 sm:grid-cols-3" : "max-w-md grid-cols-2"}`}>
            {tiles.map((sub, i) => (
              <TileButton
                key={sub.id ?? sub.name}
                label={sub.name}
                tone={TILE_TONES[i % TILE_TONES.length]}
                onClick={() => onSubServiceSelect?.(sub)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

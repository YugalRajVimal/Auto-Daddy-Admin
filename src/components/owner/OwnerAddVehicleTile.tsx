/** Mockup "Add Vehicle Info" tile: car-with-plus icon in a rounded box with a link caption. */
export function AddVehicleTile({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="group mx-auto flex flex-col items-center gap-2 py-4">
      <span
        className={`flex items-center justify-center rounded-2xl border-2 border-indigo-400 bg-white shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-lg ${
          compact ? "size-28" : "size-56"
        }`}
      >
        <svg viewBox="0 0 64 64" className={compact ? "size-16" : "size-36"} aria-hidden>
          <defs>
            <linearGradient id="ad-add-car" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#4f7df3" />
              <stop offset="1" stopColor="#6b4ef0" />
            </linearGradient>
          </defs>
          <path d="M56 32a24 24 0 1 1-8.2-18.1" fill="none" stroke="url(#ad-add-car)" strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M19 37v-6l3.3-7.2A3 3 0 0 1 25 22h14a3 3 0 0 1 2.7 1.8L45 31v6a2 2 0 0 1-2 2h-1.5v2.5a1.5 1.5 0 0 1-3 0V39h-13v2.5a1.5 1.5 0 0 1-3 0V39H21a2 2 0 0 1-2-2Zm5-8h16l-2-4.5H26L24 29Zm0 6.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm16 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"
            fill="url(#ad-add-car)"
          />
          <path d="M51 44v10M46 49h10" stroke="#6b4ef0" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className={`font-medium text-ad-purple underline underline-offset-4 group-hover:text-blue-700 ${compact ? "text-sm" : "text-xl text-blue-700"}`}>
        Add Vehicle Info
      </span>
    </button>
  );
}

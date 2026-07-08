type OwnerUpdateOdometerFooterProps = {
  onClick: () => void;
  active?: boolean;
};

function SpeedometerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="14" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 14V9.5M12 14L15.5 11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8.5C8.2 6.4 10.4 5 12 5c3.5 0 6.5 2.8 7.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function OwnerUpdateOdometerFooter({ onClick, active = false }: OwnerUpdateOdometerFooterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group flex w-full flex-col items-center gap-2 text-center"
    >
      <span
        className={`flex size-14 items-center justify-center rounded-lg text-white shadow-sm transition-colors ${
          active ? "bg-blue-700" : "bg-blue-600 group-hover:bg-blue-700"
        }`}
      >
        <SpeedometerIcon />
      </span>
      <span className="text-sm font-bold text-red-600 underline decoration-red-600 underline-offset-2 group-hover:text-red-700 group-hover:decoration-red-700">
        Update Odometer
      </span>
    </button>
  );
}

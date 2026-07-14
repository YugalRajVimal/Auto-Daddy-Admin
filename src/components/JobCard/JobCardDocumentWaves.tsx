/** Decorative blue wave footer inspired by the invoice-job-card-viewer print layout. */
export function JobCardDocumentWaves({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none relative w-full overflow-hidden ${className}`} aria-hidden>
      <svg
        className="block h-[18rem] w-full sm:h-[20rem]"
        viewBox="0 0 900 160"
        preserveAspectRatio="none"
      >
        {/* Soft sky base */}
        <path
          d="M0,70 C160,35 280,95 420,60 C560,25 700,90 900,55 L900,160 L0,160 Z"
          fill="#e3f2fd"
        />
        {/* Mid ribbon */}
        <path
          d="M0,95 C140,55 260,120 400,85 C540,50 720,110 900,80 L900,160 L0,160 Z"
          fill="#90caf9"
        />
        {/* Bright sweep */}
        <path
          d="M0,115 C180,70 300,140 460,105 C620,70 760,130 900,100 L900,160 L0,160 Z"
          fill="#42a5f5"
        />
        {/* Deep navy ribbon from bottom-left */}
        <path
          d="M0,130 C120,95 220,150 360,125 C520,95 680,145 900,120 L900,160 L0,160 Z"
          fill="#1565c0"
        />
        {/* White cut / highlight ribbon */}
        <path
          d="M0,88 C200,50 340,115 500,78 C650,45 780,95 900,70 L900,95 C780,115 650,70 500,100 C340,132 200,75 0,110 Z"
          fill="#ffffff"
          fillOpacity="0.92"
        />
        {/* Thin accent stroke following the bright sweep */}
        <path
          d="M0,112 C180,68 300,136 460,102 C620,68 760,126 900,98"
          fill="none"
          stroke="#0d47a1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Secondary thin accent */}
        <path
          d="M0,128 C140,98 260,148 400,122 C560,94 720,140 900,118"
          fill="none"
          stroke="#1976d2"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

/** Soft header wash matching the viewer document top. */
export function JobCardDocumentHeaderWave({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none block h-44 w-full sm:h-52 ${className}`}
      viewBox="0 0 900 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,60 C150,20 300,90 450,55 C600,20 750,85 900,50 L900,0 L0,0 Z"
        fill="rgba(66,165,245,0.12)"
      />
      <path
        d="M0,75 C180,35 360,95 540,60 C720,30 810,80 900,65 L900,0 L0,0 Z"
        fill="rgba(25,118,210,0.08)"
      />
    </svg>
  );
}

export const PaidStampToggle: React.FC<{
    paid: boolean;
    onToggle: () => void;
  }> = ({ paid, onToggle }) => {
    const color = paid ? "#3B6D11" : "#A32D2D"; // dark green / dark red — reads well on transparent bg
  
    const teeth = (() => {
      const cx = 100, cy = 100, n = 28, rOuter = 78, rInner = 68;
      const pts: string[] = [];
      for (let i = 0; i < n * 2; i++) {
        const ang = (Math.PI * 2 * i) / (n * 2);
        const r = i % 2 === 0 ? rOuter : rInner;
        pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
      }
      return pts.join(" ");
    })();
  
    const arcPath = (r: number, top: boolean) => {
      const cx = 100, cy = 100;
      const startAng = top ? 200 : 20;
      const endAng = top ? 340 : 160;
      const s = (Math.PI / 180) * startAng;
      const e = (Math.PI / 180) * endAng;
      const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
      const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };
  
    return (
      <button
        type="button"
        onClick={onToggle}
        title={paid ? "Mark as unpaid" : "Mark as paid"}
        aria-label={paid ? "Mark as unpaid" : "Mark as paid"}
        className="relative select-none h-[145px] w-[145px] p-0 bg-transparent border-0 cursor-pointer transition duration-200 hover:opacity-80"
        style={{ transform: "rotate(-13deg)" }} // increasing rotate from -8 to -13deg
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {/* Jagged outline only — no fill, so the center stays transparent */}
          <polygon points={teeth} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
          <circle cx="100" cy="100" r="66" fill="none" stroke={color} strokeWidth={2.5} />
          <circle cx="100" cy="100" r="58" fill="none" stroke={color} strokeWidth={2.5} />
          <path id="topArc" d={arcPath(46, true)} fill="none" />
          <path id="botArc" d={arcPath(46, false)} fill="none" />
          <text fontFamily="sans-serif" fontSize="11" fontWeight={600} letterSpacing="3" fill={color}>
            <textPath href="#topArc" startOffset="50%" textAnchor="middle">THANK YOU</textPath>
          </text>
          <text fontFamily="sans-serif" fontSize="11" fontWeight={600} letterSpacing="3" fill={color}>
            <textPath href="#botArc" startOffset="50%" textAnchor="middle">THANK YOU</textPath>
          </text>
          <text
            x="100"
            y="112"
            fontFamily="sans-serif"
            fontSize={paid ? 38 : 26}
            fontWeight={700}
            letterSpacing="1"
            fill={color}
            textAnchor="middle"
          >
            {paid ? "PAID" : "UNPAID"}
          </text>
        </svg>
      </button>
 
    );
  };
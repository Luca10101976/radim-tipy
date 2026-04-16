interface Props {
  size?: number;
  className?: string;
}

export default function RadimAvatar({ size = 80, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Radim"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#F5F0EB" />

      {/* Antenna left */}
      <line x1="38" y1="18" x2="34" y2="8" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="34" cy="7" r="3" fill="#2DD4BF" />

      {/* Antenna right */}
      <line x1="62" y1="18" x2="66" y2="8" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="66" cy="7" r="3" fill="#2DD4BF" />

      {/* Head */}
      <rect x="27" y="18" width="46" height="36" rx="14" fill="#2DD4BF" />

      {/* Visor */}
      <rect x="32" y="23" width="36" height="26" rx="9" fill="#0F1C1A" />

      {/* Eyes */}
      <ellipse cx="42" cy="33" rx="5" ry="6" fill="#2DD4BF" opacity="0.9" />
      <ellipse cx="58" cy="33" rx="5" ry="6" fill="#2DD4BF" opacity="0.9" />

      {/* Smile */}
      <path d="M43 42 Q50 47 57 42" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* Ear left */}
      <rect x="23" y="28" width="5" height="10" rx="2.5" fill="#14B8A6" />
      {/* Ear right */}
      <rect x="72" y="28" width="5" height="10" rx="2.5" fill="#14B8A6" />

      {/* Neck */}
      <rect x="44" y="54" width="12" height="6" rx="2" fill="#14B8A6" />

      {/* Body */}
      <rect x="28" y="60" width="44" height="30" rx="12" fill="#2DD4BF" />

      {/* R badge */}
      <circle cx="50" cy="74" r="9" fill="#F5F0EB" />
      <text x="50" y="78" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0F2926" fontFamily="sans-serif">R</text>

      {/* Arm left */}
      <rect x="16" y="62" width="12" height="6" rx="3" fill="#14B8A6" />
      <circle cx="15" cy="65" r="5" fill="#0F2926" />

      {/* Arm right - pointing up */}
      <rect x="72" y="62" width="12" height="6" rx="3" fill="#14B8A6" />
      <rect x="80" y="52" width="6" height="14" rx="3" fill="#14B8A6" />
      <circle cx="83" cy="50" r="5" fill="#0F2926" />
      {/* Pointing finger */}
      <rect x="81" y="42" width="4" height="10" rx="2" fill="#0F2926" />
    </svg>
  );
}

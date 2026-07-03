type MascotMood = "happy" | "waving" | "celebrating" | "thinking" | "sleepy" | "love";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

/**
 * Momo — Monexa's mascot. A friendly round indigo owl with gold belly markings.
 * Used across onboarding, chat, empty states, and celebratory moments.
 */
export function Mascot({ mood = "happy", size = 120, className = "" }: MascotProps) {
  const eyeState = mood === "sleepy" ? "sleepy" : mood === "love" ? "love" : "open";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="100" cy="185" rx="55" ry="10" fill="#4A3FB5" opacity="0.12" />

      {mood === "waving" && (
        <ellipse cx="158" cy="95" rx="14" ry="20" fill="#6C5CE7" transform="rotate(25 158 95)" className="mx-anim-wiggle" style={{ transformOrigin: "158px 95px" }} />
      )}

      <ellipse cx="100" cy="112" rx="72" ry="68" fill="#6C5CE7" />
      <ellipse cx="100" cy="130" rx="46" ry="42" fill="#FFC94D" />

      <path d="M40 60 Q30 20 55 30 Q60 45 50 62 Z" fill="#4A3FB5" />
      <path d="M160 60 Q170 20 145 30 Q140 45 150 62 Z" fill="#4A3FB5" />

      <circle cx="76" cy="100" r="26" fill="white" />
      <circle cx="124" cy="100" r="26" fill="white" />

      {eyeState === "open" && (
        <>
          <circle cx="78" cy="102" r="12" fill="#201A2B" />
          <circle cx="122" cy="102" r="12" fill="#201A2B" />
          <circle cx="82" cy="98" r="4" fill="white" />
          <circle cx="126" cy="98" r="4" fill="white" />
        </>
      )}
      {eyeState === "sleepy" && (
        <>
          <path d="M66 102 Q78 112 90 102" stroke="#201A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M110 102 Q122 112 134 102" stroke="#201A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      )}
      {eyeState === "love" && (
        <>
          <path d="M78 96 L84 108 L90 96 Q84 88 78 96 Z" fill="#FF6B6B" />
          <path d="M122 96 L128 108 L134 96 Q128 88 122 96 Z" fill="#FF6B6B" />
        </>
      )}

      <path d="M92 118 L100 132 L108 118 Z" fill="#FF9F45" />

      {(mood === "happy" || mood === "waving" || mood === "love") && (
        <path d="M84 142 Q100 156 116 142" stroke="#201A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
      {mood === "celebrating" && (
        <path d="M80 140 Q100 162 120 140" stroke="#201A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
      {mood === "thinking" && (
        <path d="M88 146 Q100 144 112 146" stroke="#201A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}

      <circle cx="60" cy="120" r="8" fill="#FF9F45" opacity="0.5" />
      <circle cx="140" cy="120" r="8" fill="#FF9F45" opacity="0.5" />

      <ellipse cx="60" cy="168" rx="14" ry="8" fill="#FF9F45" />
      <ellipse cx="140" cy="168" rx="14" ry="8" fill="#FF9F45" />
    </svg>
  );
}

export function ConfettiBurst({ count = 12 }: { count?: number }) {
  const colors = ["#6C5CE7", "#FFC94D", "#00C896", "#FF6B6B"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            top: "-20px",
            background: colors[i % colors.length],
            animation: `mx-confetti-fall ${1.4 + (i % 5) * 0.2}s ease-in ${(i % 6) * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

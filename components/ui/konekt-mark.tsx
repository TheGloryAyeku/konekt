import { cn } from "@/lib/utils";

interface KonektMarkProps {
  size?: number;
  className?: string;
}

export function KonektMark({ size = 28, className }: KonektMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Dark square background */}
      <rect width="100" height="100" rx="22" fill="#16181c" />

      {/* Upper leaf — organic crescent, upper-left quadrant */}
      <path
        d="M12 26 C12 10, 26 4, 36 12 C46 20, 44 38, 32 44 C20 50, 8 40, 12 26 Z"
        fill="white"
      />

      {/* Lower leaf — mirrored crescent, lower-left quadrant */}
      <path
        d="M12 74 C8 60, 20 50, 32 56 C44 62, 46 80, 36 88 C26 96, 12 90, 12 74 Z"
        fill="white"
      />

      {/* Horizontal spine connecting leaves to ray origin */}
      <rect x="38" y="45" width="16" height="10" rx="5" fill="white" />

      {/* Rays fanning from convergence point (54, 50) to right edge */}
      <line x1="54" y1="50" x2="90" y2="12" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="54" y1="50" x2="90" y2="29" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="54" y1="50" x2="90" y2="50" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="54" y1="50" x2="90" y2="71" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="54" y1="50" x2="90" y2="88" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

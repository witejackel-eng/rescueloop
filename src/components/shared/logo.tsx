import { cn } from "@/lib/utils";

export function RescueLoopLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="8" fill="#147D68" />
        <path
          d="M8 18.5C8 18.5 9.5 15 14 15C18.5 15 20 18.5 20 18.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 9.5C8 9.5 9.5 13 14 13C18.5 13 20 9.5 20 9.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="14" cy="14" r="2" fill="white" />
      </svg>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-[#171A17]">
          RescueLoop
        </span>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

export function StatusIndicator({ status, className, showLabel = false }: StatusIndicatorProps) {
  const isOnline = status.toLowerCase() === "online";
  const isWarning = status.toLowerCase() === "warning";
  
  let colorClass = "bg-slate-500";
  let glowClass = "";
  
  if (isOnline) {
    colorClass = "bg-emerald-500";
    glowClass = "shadow-[0_0_8px_rgba(16,185,129,0.6)]";
  } else if (isWarning) {
    colorClass = "bg-amber-500";
    glowClass = "shadow-[0_0_8px_rgba(245,158,11,0.6)]";
  } else {
    colorClass = "bg-rose-500";
    glowClass = "shadow-[0_0_8px_rgba(244,63,94,0.6)]";
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-500", colorClass, glowClass)} />
      {showLabel && (
        <span className={cn(
          "uppercase text-xs font-bold tracking-wider",
          isOnline ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400"
        )}>
          {status}
        </span>
      )}
    </div>
  );
}

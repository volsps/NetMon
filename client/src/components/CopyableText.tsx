import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CopyableTextProps {
  text: string;
  label?: string;
  className?: string;
  icon?: boolean;
}

export function CopyableText({ text, label, className, icon = true }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        description: `Copied ${label || "text"} to clipboard`,
        className: "bg-cyan-950 border-cyan-800 text-cyan-100",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer font-mono text-sm transition-colors hover:text-cyan-400", 
        className
      )}
      onClick={handleCopy}
      role="button"
      title="Click to copy"
    >
      <span>{text}</span>
      {icon && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </span>
      )}
    </div>
  );
}

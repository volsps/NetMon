import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Server, Router, Wifi, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/use-network";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Header() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: results, isLoading } = useSearch(query);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: any) => {
    setIsOpen(false);
    setQuery("");
    if (result.type === 'site') {
      setLocation(`/sites/${result.id}`);
    } else {
      setLocation(`/sites/${result.siteId}`);
      // In a real app, we might also pass state to highlight the specific switch/ap
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50">
      <div className="max-w-xl w-full mx-auto relative" ref={wrapperRef}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <Input 
            className="pl-10 pr-10 bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50 transition-all shadow-inner" 
            placeholder="Search IP, MAC, Name, or Address..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
          )}
          {query && !isLoading && (
             <button 
               onClick={() => { setQuery(""); setIsOpen(false); }}
               className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-slate-200 text-slate-600"
             >
               <X className="w-4 h-4" />
             </button>
          )}
        </div>

        {/* Search Dropdown */}
        {isOpen && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden max-h-[400px] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {results && results.length > 0 ? (
              <div className="py-2">
                {results.map((result, idx) => (
                  <button
                    key={`${result.type}-${result.id}-${idx}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800/50 last:border-0"
                  >
                    <div className={cn(
                      "p-2 rounded-md border",
                      result.type === 'site' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                      result.type === 'switch' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                      "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}>
                      {result.type === 'site' && <Server className="w-4 h-4" />}
                      {result.type === 'switch' && <Router className="w-4 h-4" />}
                      {result.type === 'ap' && <Wifi className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium flex items-center gap-2">
                        {result.name}
                        <span className="text-[10px] uppercase bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">
                          {result.type}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 font-mono mt-0.5">
                        {result.detail}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                {isLoading ? "Searching..." : "No results found."}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

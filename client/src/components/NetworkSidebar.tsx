import { useSites } from "@/hooks/use-network";
import { Link, useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, Server, Activity, Wifi, Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupedSites {
  [type: string]: {
    [city: string]: Array<{ id: number; name: string; status: string }>;
  };
}

export function NetworkSidebar() {
  const { data: sites, isLoading } = useSites();
  const [location] = useLocation();

  const currentId = location.startsWith("/sites/")
    ? parseInt(location.split("/")[2])
    : null;

  if (isLoading) {
    return (
      <div className="w-72 h-full bg-slate-950 border-r border-slate-800 p-4 space-y-4">
        <Skeleton className="h-10 w-full bg-slate-900" />
        <Skeleton className="h-10 w-full bg-slate-900" />
      </div>
    );
  }

  // Группировка данных
  const grouped = sites?.reduce<GroupedSites>((acc, site) => {
    const type = site.networkType || (site.name.toUpperCase().includes('B2B') ? 'B2B' : 'OWF');
    const city = site.city || "Almaty";

    if (!acc[type]) acc[type] = {};
    if (!acc[type][city]) acc[type][city] = [];
    
    acc[type][city].push({
      id: site.id,
      name: site.name,
      status: site.status
    });
    return acc;
  }, {}) || {};

  return (
    <aside className="w-72 h-full bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl">
      {/* Логотип */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-none tracking-tight">NETMON</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-[0.2em]">Infrastructure</p>
          </div>
        </div>
      </div>

      {/* Меню */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* Внешний аккордеон для OWF/B2B (по умолчанию пустой массив - всё скрыто) */}
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(grouped).sort().map(([type, cities]) => (
            <AccordionItem key={type} value={type} className="border-none">
              <AccordionTrigger className="px-4 py-2 hover:bg-slate-900/50 hover:no-underline rounded-lg transition-all">
                <div className="flex items-center gap-3">
                  {type === 'OWF' ? 
                    <Wifi className="w-4 h-4 text-emerald-400" /> : 
                    <Building2 className="w-4 h-4 text-amber-400" />
                  }
                  <span className="text-sm font-black text-slate-200 tracking-widest">{type} NETWORK</span>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="pt-2 pb-0 ml-2 border-l border-slate-800/50">
                {/* Внутренний аккордеон для городов */}
                <Accordion type="multiple" className="space-y-1">
                  {Object.entries(cities).map(([city, citySites]) => (
                    <AccordionItem key={city} value={city} className="border-none">
                      <AccordionTrigger className="px-4 py-1.5 hover:bg-slate-900/30 hover:no-underline rounded-md transition-all group">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-300 uppercase">
                            {city}
                          </span>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="pt-1 pb-2">
                        <div className="pl-4 space-y-0.5">
                          {citySites.map((site) => (
                            <Link key={site.id} href={`/sites/${site.id}`}>
                              <div className={cn(
                                "group flex items-center justify-between px-4 py-2 rounded-md cursor-pointer transition-all border",
                                currentId === site.id
                                  ? "bg-cyan-500/10 border-cyan-500/30"
                                  : "border-transparent hover:bg-slate-900 hover:border-slate-800"
                              )}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <Server className={cn(
                                    "w-3.5 h-3.5",
                                    currentId === site.id ? "text-cyan-400" : "text-slate-700"
                                  )} />
                                  <span className={cn(
                                    "text-xs truncate",
                                    currentId === site.id ? "text-cyan-100 font-bold" : "text-slate-400"
                                  )}>
                                    {site.name}
                                  </span>
                                </div>
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  site.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500"
                                )} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/20 text-[10px] text-slate-600 flex justify-between font-mono italic">
        <span>SYSTEM_SECURE_AUTH</span>
        <span className="text-cyan-900">v2.4.1</span>
      </div>
    </aside>
  );
}

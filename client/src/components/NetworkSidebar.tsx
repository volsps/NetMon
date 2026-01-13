import { useSites } from "@/hooks/use-network";
import { Link, useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, Server, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupedSites {
  [region: string]: {
    [city: string]: Array<{ id: number; name: string; status: string }>;
  };
}

export function NetworkSidebar() {
  const { data: sites, isLoading } = useSites();
  const [location] = useLocation();

  // Parse ID from URL /sites/:id
  const currentId = location.startsWith("/sites/") 
    ? parseInt(location.split("/")[2]) 
    : null;

  if (isLoading) {
    return (
      <div className="w-64 h-full bg-slate-900 border-r border-slate-800 p-4 space-y-4">
        <Skeleton className="h-8 w-3/4 bg-slate-800" />
        <Skeleton className="h-4 w-full bg-slate-800" />
        <Skeleton className="h-4 w-5/6 bg-slate-800" />
        <Skeleton className="h-4 w-4/6 bg-slate-800" />
      </div>
    );
  }

  // Group sites by Region -> City
  const grouped = sites?.reduce<GroupedSites>((acc, site) => {
    if (!acc[site.region]) acc[site.region] = {};
    if (!acc[site.region][site.city]) acc[site.region][site.city] = [];
    acc[site.region][site.city].push({ 
      id: site.id, 
      name: site.name,
      status: site.status 
    });
    return acc;
  }, {}) || {};

  return (
    <aside className="w-72 h-full bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-none tracking-wide">NETMON</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">System v2.4</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Accordion type="multiple" className="space-y-2">
          {Object.entries(grouped).map(([region, cities]) => (
            <AccordionItem key={region} value={region} className="border-slate-800 border rounded-lg overflow-hidden bg-slate-900">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-800/50 hover:no-underline transition-colors">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">{region}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="bg-slate-950/50">
                  {Object.entries(cities).map(([city, citySites]) => (
                    <div key={city} className="border-t border-slate-800/50">
                      <div className="px-4 py-2 bg-slate-900/30">
                        <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {city}
                        </span>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {citySites.map((site) => (
                          <Link key={site.id} href={`/sites/${site.id}`}>
                            <div className={cn(
                              "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-200 border border-transparent",
                              currentId === site.id 
                                ? "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]" 
                                : "hover:bg-slate-800 hover:border-slate-700"
                            )}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                <Server className={cn(
                                  "w-4 h-4 shrink-0 transition-colors",
                                  currentId === site.id ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"
                                )} />
                                <span className={cn(
                                  "text-sm font-medium truncate transition-colors",
                                  currentId === site.id ? "text-cyan-100" : "text-slate-400 group-hover:text-slate-200"
                                )}>
                                  {site.name}
                                </span>
                              </div>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                site.status === 'online' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"
                              )} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-600 text-center font-mono">
        CONNECTED: SECURE
      </div>
    </aside>
  );
}

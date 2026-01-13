import { useParams } from "wouter";
import { useSite } from "@/hooks/use-network";
import { NetworkSidebar } from "@/components/NetworkSidebar";
import { Header } from "@/components/Header";
import { CopyableText } from "@/components/CopyableText";
import { StatusIndicator } from "@/components/StatusIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Router as RouterIcon, 
  Wifi, 
  Server, 
  MapPin, 
  Network, 
  ArrowRightLeft,
  Search,
  Activity,
  Box,
  Cpu
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const params = useParams();
  const siteId = params.id ? parseInt(params.id) : null;
  const { data: site, isLoading, error } = useSite(siteId);
  const [selectedSwitchId, setSelectedSwitchId] = useState<number | null>(null);
  const [apFilter, setApFilter] = useState("");

  // Filter Access Points based on selected switch and text input
  const filteredAPs = useMemo(() => {
    if (!site) return [];
    
    let aps = site.accessPoints || [];

    // Filter by Switch Click
    if (selectedSwitchId) {
      aps = aps.filter(ap => ap.switchId === selectedSwitchId);
    }

    // Filter by Search Input
    if (apFilter) {
      const q = apFilter.toLowerCase();
      aps = aps.filter(ap => 
        ap.name.toLowerCase().includes(q) || 
        ap.ip.includes(q) || 
        ap.mac.toLowerCase().includes(q)
      );
    }

    return aps;
  }, [site, selectedSwitchId, apFilter]);

  if (!siteId) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <NetworkSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative p-8 bg-slate-900 ring-1 ring-slate-800/50 rounded-full">
                <Activity className="w-16 h-16 text-cyan-500" />
              </div>
            </div>
            <h2 className="mt-8 text-3xl font-display font-bold text-slate-100 tracking-wide">
              NETWORK <span className="text-cyan-400">MONITORING</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-md text-lg">
              Select a site from the sidebar or use the global search to view network status and telemetry.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-200">
        <NetworkSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="p-8 space-y-8">
            <Skeleton className="h-64 w-full bg-slate-900 rounded-2xl" />
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-32 w-64 bg-slate-900 rounded-xl" />
              <Skeleton className="h-32 w-64 bg-slate-900 rounded-xl" />
              <Skeleton className="h-32 w-64 bg-slate-900 rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full bg-slate-900 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="flex h-screen bg-slate-950">
        <NetworkSidebar />
        <div className="flex-1 flex items-center justify-center text-red-400">
          Error loading site data
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <NetworkSidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          
          {/* === ROUTER CARD === */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-24 bg-blue-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col md:flex-row">
              {/* Left: Info */}
              <div className="p-8 flex-1 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">{site.name}</h1>
                      <StatusIndicator status={site.status} showLabel />
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4 text-cyan-500" />
                      <span className="font-mono text-sm">{site.address} ({site.city}, {site.region})</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                    <RouterIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Router IP</label>
                    <CopyableText text={site.routerIp} className="text-lg text-slate-200 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">MAC Address</label>
                    <CopyableText text={site.routerMac} className="text-lg text-slate-200 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Model</label>
                    <div className="text-lg text-slate-200 font-display tracking-wide">{site.routerModel}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Coordinates</label>
                    <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
                      <span>Lat: {site.lat.toFixed(4)}</span>
                      <span className="text-slate-700">|</span>
                      <span>Lng: {site.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Map Placeholder */}
              <div className="md:w-80 bg-slate-950/50 border-t md:border-t-0 md:border-l border-slate-800 relative group overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
                    <div className="text-xs font-mono text-slate-600">MAP VIEW PREVIEW</div>
                  </div>
                </div>
                {/* Fake map grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />
              </div>
            </div>
          </section>

          {/* === SWITCHES (HORIZONTAL SCROLL) === */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-500" />
                Connected Switches
                <span className="text-xs font-normal text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                  {site.switches.length}
                </span>
              </h3>
              {selectedSwitchId && (
                <button 
                  onClick={() => setSelectedSwitchId(null)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  Clear Selection <ArrowRightLeft className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
              {site.switches.map((sw) => {
                const isSelected = selectedSwitchId === sw.id;
                return (
                  <div 
                    key={sw.id}
                    onClick={() => setSelectedSwitchId(isSelected ? null : sw.id)}
                    className={cn(
                      "snap-start shrink-0 w-72 bg-slate-900 border rounded-xl p-5 cursor-pointer transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:shadow-xl",
                      isSelected 
                        ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20" 
                        : "border-slate-800 hover:border-slate-700"
                    )}
                  >
                    {/* Active Gradient Background */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                    )}

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors">
                        <Box className="w-5 h-5" />
                      </div>
                      <StatusIndicator status={sw.status} />
                    </div>

                    <div className="relative z-10 space-y-1">
                      <h4 className="font-bold text-slate-200 truncate pr-2">{sw.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{sw.model}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-2 relative z-10">
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase font-semibold">IP Address</div>
                        <div className="text-xs font-mono text-slate-300 truncate">{sw.ip}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-600 uppercase font-semibold">APs</div>
                        <div className="text-xs font-mono text-cyan-400 font-bold">{sw.accessPoints.length}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* === ACCESS POINTS TABLE === */}
          <section className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Wifi className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">Access Points</h3>
                  <p className="text-xs text-slate-500">
                    Showing {filteredAPs.length} of {site.accessPoints.length} devices
                    {selectedSwitchId && " (Filtered by Switch)"}
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  className="pl-9 bg-slate-950 border-slate-700 h-9 text-sm" 
                  placeholder="Filter by Name, IP..."
                  value={apFilter}
                  onChange={(e) => setApFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">IP Address</th>
                    <th className="px-6 py-4 font-semibold">MAC Address</th>
                    <th className="px-6 py-4 font-semibold">Model</th>
                    <th className="px-6 py-4 font-semibold">Uplink Switch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {filteredAPs.map((ap) => (
                    <tr key={ap.id} className="group hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusIndicator status={ap.status} />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {ap.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 group-hover:text-cyan-300 transition-colors">
                        <CopyableText text={ap.ip} icon={false} />
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        <CopyableText text={ap.mac} icon={false} />
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3 h-3 opacity-50" />
                          {ap.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        Switch ID: {ap.switchId}
                      </td>
                    </tr>
                  ))}
                  {filteredAPs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No access points found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

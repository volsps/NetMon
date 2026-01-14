import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NetworkSidebar } from "@/components/NetworkSidebar";
import { Header } from "@/components/Header";
import { StatusIndicator } from "@/components/StatusIndicator";
import { CopyableText } from "@/components/CopyableText";
import { SiteForm } from "@/components/SiteForm";
import { DeviceForm } from "@/components/DeviceForm"; 
import {
  Router as RouterIcon,
  MapPin,
  Settings2,
  Trash2,
  Network,
  Box,
  Wifi,
  Plus,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type SiteWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const params = useParams();
  const siteId = params.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const [selectedSwitchId, setSelectedSwitchId] = useState<number | null>(null);
  const [apFilter, setApFilter] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Запрос данных объекта
  const { data: site, isLoading, error } = useQuery<SiteWithDetails>({
    queryKey: [siteId ? `/api/sites/${siteId}` : null],
    enabled: !!siteId,
  });

  // Фильтрация точек доступа
  const filteredAPs = useMemo(() => {
    if (!site || !site.accessPoints) return [];
    let aps = site.accessPoints;
    if (selectedSwitchId) {
      aps = aps.filter(ap => ap.switchId === selectedSwitchId);
    }
    if (apFilter) {
      const query = apFilter.toLowerCase();
      aps = aps.filter(ap =>
        ap.name.toLowerCase().includes(query) ||
        ap.ip.toLowerCase().includes(query) ||
        ap.mac.toLowerCase().includes(query)
      );
    }
    return aps;
  }, [site, selectedSwitchId, apFilter]);

  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите полностью удалить этот объект?")) return;
    try {
      await apiRequest("DELETE", `/api/sites/${siteId}`);
      toast({ title: "Объект успешно удален" });
      window.location.href = "/";
    } catch (err) {
      toast({ title: "Ошибка при удалении", variant: "destructive" });
    }
  };

  const deleteDevice = async (type: 'switches' | 'access-points', id: number) => {
    if (!window.confirm("Удалить это устройство?")) return;
    try {
      await apiRequest("DELETE", `/api/${type}/${id}`);
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] });
      toast({ title: "Устройство удалено" });
    } catch (err) {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  // Экран если объект не выбран
  if (!siteId) {
    return (
      <div className="flex h-screen bg-slate-950">
        <NetworkSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
             <div className="text-center space-y-4">
                <Network className="w-16 h-16 text-slate-900 mx-auto" />
                <p className="text-slate-500 italic font-sans">Выберите объект в списке слева</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Экран загрузки
  if (isLoading || !site) {
    return (
      <div className="flex h-screen bg-slate-950">
        <NetworkSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center text-slate-400 font-sans italic">
            Загрузка данных объекта...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <NetworkSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">

          {/* === СЕКЦИЯ: ИНФОРМАЦИЯ О РОУТЕРЕ И ОБЪЕКТЕ === */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden relative group">
            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-black text-white tracking-tight">{site.name}</h1>
                    <StatusIndicator status={site.status} showLabel />

                    <div className="flex gap-2 ml-4">
                      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-cyan-600 transition-colors h-8">
                            <Settings2 className="w-3.5 h-3.5 mr-2" /> Изменить объект
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                          <DialogHeader><DialogTitle>Редактировать объект</DialogTitle></DialogHeader>
                          <SiteForm site={site} onSuccess={() => setIsEditOpen(false)} />
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" onClick={handleDelete} className="bg-slate-800 border-slate-700 hover:bg-rose-600 transition-colors h-8">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4 text-cyan-500" />
                    <span className="font-medium text-sm">
                      {site.address}{site.city ? `, ${site.city}` : ''} • {site.networkType || 'Объект'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 border-t border-slate-800 font-mono">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Gateway IP</p>
                      <CopyableText text={site.routerIp || "0.0.0.0"} className="text-xl font-bold text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Model</p>
                      <p className="text-lg text-slate-200 truncate">{site.routerModel || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">MAC Address</p>
                      <p className="text-sm text-slate-400">{site.routerMac || "00:00:00:00:00:00"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Location</p>
                      <p className="text-sm text-slate-500">
                        {site.lat?.toFixed(4)}, {site.lng?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex p-6 bg-slate-950 rounded-2xl border border-slate-800 items-center justify-center min-w-[160px]">
                  <RouterIcon className="w-16 h-16 text-slate-800" />
                </div>
              </div>
            </div>
          </section>

          {/* === СЕКЦИЯ: КОММУТАТОРЫ (СВИТЧИ) === */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Network className="w-4 h-4" /> Коммутаторы ({site.switches?.length || 0})
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 transition-all px-3">
                    <Plus className="w-3 h-3 mr-1" /> Добавить свитч
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader><DialogTitle>Добавить коммутатор</DialogTitle></DialogHeader>
                  <DeviceForm type="switch" siteId={site.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] })} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-1">
              {site.switches?.map((sw) => (
                <div key={sw.id}
                     onClick={() => setSelectedSwitchId(selectedSwitchId === sw.id ? null : sw.id)}
                     className={cn(
                      "shrink-0 w-64 p-4 rounded-xl border cursor-pointer transition-all relative group/item",
                      selectedSwitchId === sw.id ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg" : "bg-slate-900 border-slate-800 hover:border-slate-700"
                     )}>
                  
                  {/* Кнопки управления (редактирование и удаление) */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-cyan-400" onClick={(e) => e.stopPropagation()}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800 text-white">
                        <DialogHeader><DialogTitle>Изменить параметры свитча</DialogTitle></DialogHeader>
                        <DeviceForm type="switch" siteId={site.id} device={sw} onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] })} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-500"
                            onClick={(e) => { e.stopPropagation(); deleteDevice('switches', sw.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <Box className={cn("w-5 h-5", selectedSwitchId === sw.id ? "text-cyan-400" : "text-slate-600")} />
                    <div className={cn("w-2 h-2 rounded-full", sw.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
                  </div>
                  <p className="font-bold text-slate-200 truncate pr-6">{sw.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{sw.ip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* === СЕКЦИЯ: ТОЧКИ ДОСТУПА === */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-cyan-500" />
                <span className="text-sm font-bold text-white">Точки доступа ({filteredAPs.length})</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  className="w-48 bg-slate-950 border-slate-800 h-8 text-xs focus:ring-cyan-500"
                  placeholder="Поиск по имени/IP/MAC..."
                  value={apFilter}
                  onChange={(e) => setApFilter(e.target.value)}
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 bg-cyan-600 hover:bg-cyan-500 text-white border-0 transition-all px-4">
                      <Plus className="w-4 h-4 mr-1" /> Добавить AP
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader><DialogTitle>Новая точка доступа</DialogTitle></DialogHeader>
                    <DeviceForm
                      type="ap"
                      siteId={site.id}
                      switchId={selectedSwitchId || site.switches?.[0]?.id || 0}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] })}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-slate-500 bg-slate-950/50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 font-bold">Статус</th>
                    <th className="px-6 py-3 font-bold">Имя устройства</th>
                    <th className="px-6 py-3 font-bold">IP-Адрес</th>
                    <th className="px-6 py-3 font-bold">MAC / Модель</th>
                    <th className="px-6 py-3 font-bold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredAPs.map((ap) => (
                    <tr key={ap.id} className="hover:bg-slate-800/30 transition-colors group/row">
                      <td className="px-6 py-4">
                        <div className={cn("w-2 h-2 rounded-full", ap.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">{ap.name}</td>
                      <td className="px-6 py-4 font-mono text-cyan-400/80 text-sm">{ap.ip}</td>
                      <td className="px-6 py-4">
                         <div className="text-[10px] font-mono text-slate-500">{ap.mac}</div>
                         <div className="text-[10px] text-slate-600 truncate max-w-[150px]">{ap.model}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-cyan-400">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 text-white">
                              <DialogHeader><DialogTitle>Изменить точку доступа</DialogTitle></DialogHeader>
                              <DeviceForm type="ap" siteId={site.id} device={ap} onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] })} />
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-500"
                                  onClick={() => deleteDevice('access-points', ap.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAPs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic font-sans">
                        Устройства не найдены или не добавлены
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

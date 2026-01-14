import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteSchema, type Site } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SiteFormProps {
  site?: Site; // Если передан — режим редактирования
  onSuccess: () => void;
}

export function SiteForm({ site, onSuccess }: SiteFormProps) {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertSiteSchema),
    defaultValues: site || {
      name: "",
      address: "",
      city: "",
      region: "Almaty",
      routerIp: "",
      routerMac: "",
      routerModel: "MikroTik",
      lat: 43.2389,
      lng: 76.8897,
      status: "online",
      networkType: "GPON"
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (site) {
        await apiRequest("PATCH", `/api/sites/${site.id}`, data);
        toast({ title: "Объект обновлен" });
      } else {
        await apiRequest("POST", "/api/sites", data);
        toast({ title: "Объект создан" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      onSuccess();
    } catch (error) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось сохранить данные", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название объекта</FormLabel>
              <FormControl><Input placeholder="Например: Теренкур-1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="routerIp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Роутера</FormLabel>
                <FormControl><Input placeholder="10.x.x.x" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="routerModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Модель</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Адрес</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {site ? "Сохранить изменения" : "Создать объект"}
        </Button>
      </form>
    </Form>
  );
}

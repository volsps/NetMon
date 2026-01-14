import { useForm } from "react-hook-form";
import { insertSwitchSchema, insertAccessPointSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DeviceFormProps {
  type: 'switch' | 'ap';
  siteId: number;
  device?: any; // Если есть — редактирование
  switchId?: number; // Для точек доступа (к какому свитчу крепим)
  onSuccess: () => void;
}

export function DeviceForm({ type, siteId, device, switchId, onSuccess }: DeviceFormProps) {
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: device || {
      name: "",
      ip: "",
      mac: "",
      model: "",
      status: "online",
      siteId: siteId,
      ...(type === 'ap' ? { switchId: switchId || 0 } : {})
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const endpoint = type === 'switch' ? '/api/switches' : '/api/access-points';
      if (device) {
        await apiRequest("PATCH", `${endpoint}/${device.id}`, data);
      } else {
        await apiRequest("POST", endpoint, data);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}`] });
      onSuccess();
      toast({ title: "Данные сохранены" });
    } catch (error) {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="ip" render={({ field }) => (
            <FormItem><FormLabel>IP Адрес</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem><FormLabel>Модель</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="mac" render={({ field }) => (
          <FormItem><FormLabel>MAC Адрес</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </form>
    </Form>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function SellerAppointmentsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const WEEK_DAYS = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday")];

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [availabilities, setAvailabilities] = useState(
    WEEK_DAYS.map(day => ({ day, active: false, start_time: "09:00", end_time: "17:00" }))
  );

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["seller-appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  const saveAvailability = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sellers/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ availability: availabilities }),
      });
      if (!res.ok) throw new Error(t("save_failed"));
      return res.json();
    },
    onSuccess: () => toast({ title: t("availability_saved") }),
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const confirmAppointment = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/appointments/${id}/confirm`, {
        method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("confirm_failed"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-appointments"] }),
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("cancel_failed"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-appointments"] }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-primary">{t("appointments_title")}</p>
        <h1 className="text-3xl font-bold">{t("availability_and_appointments")}</h1>
        <p className="text-muted-foreground">{t("availability_and_appointments_desc")}</p>
      </div>

      <Tabs defaultValue="disponibilites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="disponibilites">{t("availabilities")}</TabsTrigger>
          <TabsTrigger value="rendez-vous">{t("appointments_title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibilites" className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4">
                {availabilities.map((item, index) => (
                  <div key={item.day} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">{item.day}</p>
                        <p className="text-sm text-muted-foreground">{t("set_opening_hours")}</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={item.active} onChange={e => {
                            const updated = [...availabilities];
                            updated[index].active = e.target.checked;
                            setAvailabilities(updated);
                          }} className="h-4 w-4 rounded border" />
                          {t("active")}
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>{t("start_time")}</Label>
                            <Input value={item.start_time} type="time" onChange={e => {
                              const updated = [...availabilities];
                              updated[index].start_time = e.target.value;
                              setAvailabilities(updated);
                            }} />
                          </div>
                          <div>
                            <Label>{t("end_time")}</Label>
                            <Input value={item.end_time} type="time" onChange={e => {
                              const updated = [...availabilities];
                              updated[index].end_time = e.target.value;
                              setAvailabilities(updated);
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => saveAvailability.mutate()} disabled={saveAvailability.isPending}>
                {t("save_availabilities")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendez-vous" className="space-y-6">
          {isLoading ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">{t("loading")}</CardContent></Card>
          ) : !appointments?.length ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_appointments")}</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="grid gap-4 md:grid-cols-[1.2fr_auto] md:items-center pt-4">
                    <div className="space-y-2">
                      <p className="font-semibold">{a.service_title}</p>
                      <p className="text-sm text-muted-foreground">{t("client_label")}: {a.client_name}</p>
                      <p className="text-sm text-muted-foreground">{t("date_col")}: {new Date(a.date).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{t("duration")}: {a.duration_minutes} {t("minutes")}</p>
                      <Badge>{a.status}</Badge>
                    </div>
                    {a.status === "pending" && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button size="sm" onClick={() => confirmAppointment.mutate(a.id)}>{t("confirm_btn")}</Button>
                        <Button size="sm" variant="destructive" onClick={() => cancelAppointment.mutate(a.id)}>{t("cancel")}</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
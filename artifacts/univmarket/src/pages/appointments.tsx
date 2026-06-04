import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAuthenticated) { setLocation("/"); return null; }

  const { data: appointments, isLoading } = useQuery(["appointments"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/appointments", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("appointments_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("appointments_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !appointments?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_appointments")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("my_appointments")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("services")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("date_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("status_col")}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{a.service_name ?? a.service_id}</td>
                    <td className="py-3 px-4">{new Date(a.start_time).toLocaleString()}</td>
                    <td className="py-3 px-4">{a.status ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

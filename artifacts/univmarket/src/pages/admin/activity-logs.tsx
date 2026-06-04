import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminActivityLogs() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: logs, isLoading } = useQuery(["admin-activity-logs"], async () => {
    const res = await fetch("/api/activity-logs", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("activity_logs_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("activity_logs_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !logs?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_logs")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("latest_actions")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("user_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("action_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("date_col")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{log.user_name ?? log.user_id}</td>
                    <td className="py-3 px-4">{log.action}</td>
                    <td className="py-3 px-4">{new Date(log.created_at).toLocaleDateString()}</td>
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
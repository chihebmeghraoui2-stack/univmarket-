import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminWilayaChangeRequests() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: requests, isLoading } = useQuery(["admin-wilaya-change"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/wilaya-change", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("wilaya_change_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("wilaya_change_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !requests?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_pending_requests")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("requests")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("user_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("from_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("to_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("date_col")}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request: any) => (
                  <tr key={request.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{request.user_name ?? request.user_id}</td>
                    <td className="py-3 px-4">{request.from_wilaya_name ?? request.from_wilaya_id}</td>
                    <td className="py-3 px-4">{request.to_wilaya_name ?? request.to_wilaya_id}</td>
                    <td className="py-3 px-4">{new Date(request.created_at).toLocaleDateString()}</td>
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

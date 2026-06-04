import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminReports() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: reports, isLoading } = useQuery(["admin-reports"], async () => {
    const res = await fetch("/api/reports", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("reports_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("reports_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !reports?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_reports")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("recent_reports")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("type_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("subject_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("registration_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("status_col")}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: any) => (
                  <tr key={report.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{report.type}</td>
                    <td className="py-3 px-4">{report.subject ?? report.description ?? "-"}</td>
                    <td className="py-3 px-4">{new Date(report.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Badge className={report.resolved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {report.resolved ? t("dispute_resolved_status") : t("pending")}
                      </Badge>
                    </td>
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
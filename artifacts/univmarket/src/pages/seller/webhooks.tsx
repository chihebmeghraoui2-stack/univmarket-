import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function SellerWebhooks() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const { data: webhooks, isLoading } = useQuery(["seller-webhooks"], async () => {
    const res = await fetch("/api/webhooks", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("webhooks_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("webhooks_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !webhooks?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_webhooks")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Endpoints</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("full_name")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">URL</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("events")}</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((endpoint: any) => (
                  <tr key={endpoint.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{endpoint.name}</td>
                    <td className="py-3 px-4 break-all">{endpoint.url}</td>
                    <td className="py-3 px-4">{endpoint.events?.join(", ") ?? "-"}</td>
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
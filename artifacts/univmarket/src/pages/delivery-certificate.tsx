import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation, useRoute } from "wouter";
import { useTranslation } from "react-i18next";

export default function DeliveryCertificatePage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/delivery-certificate/:id");
  const certificateId = params?.id;

  if (!isAuthenticated) { setLocation("/"); return null; }
  if (!certificateId) return <div className="max-w-5xl mx-auto px-4 py-16">{t("missing_id")}</div>;

  const { data: certificate, isLoading } = useQuery(["delivery-certificate", certificateId], async () => {
    const res = await fetch(`/api/delivery-certificate/${certificateId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("delivery_certificate")}</h1>
        <p className="text-muted-foreground text-sm">{t("delivery_certificate_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !certificate ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("cert_not_found")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("cert_info")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("order_title")}</p>
                <p className="font-medium">#{certificate.order_id}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("delivery_method")}</p>
                <p className="font-medium">{certificate.delivery_method ?? "-"}</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{t("notes")}</p>
              <p>{certificate.description ?? t("no_description")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
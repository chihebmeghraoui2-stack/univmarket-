import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function VerifyPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/verify/:id");
  const certificateId = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["certificate", certificateId],
    queryFn: async () => {
      if (!certificateId) throw new Error(t("missing_id"));
      const res = await fetch(`/api/certificates/${certificateId}`);
      if (!res.ok) throw new Error(t("cert_not_found"));
      return res.json();
    },
    enabled: Boolean(certificateId),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-8 space-y-3 text-center">
        <p className="text-sm uppercase tracking-widest text-primary">{t("cert_verification")}</p>
        <h1 className="text-3xl font-bold">{t("service_certificate")}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-72" />
        </div>
      ) : isError || !data ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("cert_not_found_desc")}</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4">
                <span>{t("certificate")} #{data.id}</span>
                <Badge className={data.valid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                  {data.valid ? t("valid") : t("invalid")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("order_title")}</p>
                <p className="font-semibold">#{data.order_id}</p>
                <p className="text-sm text-muted-foreground">{t("service_desc")}</p>
                <p className="font-semibold">{data.service_title}</p>
                <p className="text-sm text-muted-foreground">{t("seller_label")}</p>
                <p className="font-semibold">{data.seller_name} · {data.seller_wilaya}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("client_label")}</p>
                <p className="font-semibold">{data.client_name}</p>
                <p className="text-sm text-muted-foreground">{t("completion_date")}</p>
                <p className="font-semibold">{new Date(data.completed_at).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">{t("verified_times")}</p>
                <p className="font-semibold">{data.verified_count} {t("times")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">{t("secure_verification_code")}</p>
              <p className="text-lg font-semibold">{data.verification_url}</p>
              <Button asChild>
                <a href={`/api/certificates/${data.id}/pdf`} target="_blank" rel="noreferrer">{t("download_pdf")}</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
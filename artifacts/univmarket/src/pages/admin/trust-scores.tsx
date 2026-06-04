import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function AdminTrustScoresPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-trust-scores"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trust-scores", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  const details = useMemo(() => data?.details ?? [], [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("trust_scores_title")}</h1>
        <p className="text-muted-foreground">{t("trust_scores_global_desc")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border bg-muted/30 p-6">
                <p className="text-sm uppercase tracking-widest text-muted-foreground">{t("global_score")}</p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-5xl font-bold">{data?.score ?? 0}</span>
                  <Badge variant="secondary">{data?.level ?? "N/A"}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t("score_calculation_desc")}</p>
              </div>
              <div className="lg:col-span-2 rounded-3xl border p-6">
                <h2 className="text-xl font-semibold">{t("trust_score_details")}</h2>
                <p className="text-sm text-muted-foreground">{t("trust_factors_desc")}</p>
                <div className="mt-6 space-y-4">
                  {details.map((item: any) => (
                    <div key={item.name} className="space-y-2 rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <span className="text-lg font-semibold">{item.score}%</span>
                      </div>
                      <Progress value={item.score} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
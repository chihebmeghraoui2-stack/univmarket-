import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function SellerTrustScorePage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller, user } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const { data, isLoading, isError } = useQuery(["seller-trust-score", user?.id], async () => {
    const res = await fetch(`/api/sellers/${user?.id}/trust-score`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  }, { enabled: Boolean(user?.id) });

  const determineBadge = (score: number) => {
    if (score >= 85) return { label: t("excellence_seller"), color: "bg-amber-100 text-amber-800" };
    if (score >= 70) return { label: t("reliable_seller"), color: "bg-slate-100 text-slate-700" };
    if (score >= 50) return { label: t("active_seller"), color: "bg-orange-100 text-orange-700" };
    return { label: t("new_seller"), color: "bg-gray-100 text-gray-500" };
  };

  const gauge = data ? Math.min(Math.max(data.score, 0), 100) : 0;
  const badge = useMemo(() => determineBadge(gauge), [gauge, i18n.language]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-primary">{t("trust_score")}</p>
        <h1 className="text-3xl font-bold">{t("seller_reputation")}</h1>
        <p className="text-muted-foreground">{t("seller_reputation_desc")}</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("loading")}</CardContent></Card>
      ) : isError || !data ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("load_score_error")}</CardContent></Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("global_score")}</p>
                  <p className="text-5xl font-extrabold">{gauge}</p>
                </div>
                <Badge className={badge.color}>{badge.label}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("trust_score")}</span>
                  <span className="font-semibold">{gauge}%</span>
                </div>
                <Progress value={gauge} className="h-4" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("last_calculated")}: {new Date(data.last_calculated_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("score_components")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {data.components?.map((component: any) => (
                <div key={component.label} className="space-y-2 rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{component.label}</p>
                      <p className="text-sm text-muted-foreground">{component.score} / {component.max}</p>
                    </div>
                    <span className="text-xs uppercase text-muted-foreground">
                      {Math.round((component.score / component.max) * 100)}%
                    </span>
                  </div>
                  <Progress value={Math.round((component.score / component.max) * 100)} />
                  <p className="text-sm text-muted-foreground">{component.advice}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
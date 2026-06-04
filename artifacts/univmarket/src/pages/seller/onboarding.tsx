import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { CheckCircle, Clock } from "lucide-react";

export default function SellerOnboarding() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const { data: progress, isLoading } = useQuery(["seller-onboarding"], async () => {
    const res = await fetch("/api/onboarding", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("onboarding_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("onboarding_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !progress ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_progress")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("progress")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(progress).map(([step, state]: [string, any]) => (
              <div key={step} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {state?.completed
                      ? <CheckCircle className="h-5 w-5 text-green-500" />
                      : <Clock className="h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-semibold">{step}</p>
                      <p className="text-sm text-muted-foreground">{state?.status ?? t("pending")}</p>
                    </div>
                  </div>
                  <Badge className={state?.completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                    {state?.completed ? t("status_completed") : t("todo")}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminTrustScore() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: trustScores, isLoading } = useQuery(["admin-trust-score"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/trust-score", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("trust_scores_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("trust_scores_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !trustScores?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_scores")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("trust_scores_title")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("seller_label")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("trust_score")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("last_update")}</th>
                </tr>
              </thead>
              <tbody>
                {trustScores.map((score: any) => (
                  <tr key={score.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{score.seller_name ?? score.seller_id}</td>
                    <td className="py-3 px-4">
                      <Badge className={score.score >= 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {score.score ?? "-"}/100
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{new Date(score.updated_at).toLocaleDateString()}</td>
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

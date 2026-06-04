import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

export default function SellerClientRatings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const { data: ratings, isLoading } = useQuery(["seller-client-ratings"], async () => {
    const res = await fetch("/api/client-ratings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("client_ratings_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("client_ratings_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !ratings?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_ratings")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("feedback")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("client_label")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("rating")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("comment")}</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating: any) => (
                  <tr key={rating.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{rating.client_name ?? rating.client_id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{rating.score ?? "-"}/5</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{rating.comment ?? "-"}</td>
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
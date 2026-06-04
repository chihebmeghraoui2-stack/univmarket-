import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminBanners() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: banners, isLoading } = useQuery(["admin-banners"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/banners", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("banners_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("banners_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !banners?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_banners")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("banners_list")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("service_title")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("clicks_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">URL</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("status_col")}</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner: any) => (
                  <tr key={banner.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{banner.title}</td>
                    <td className="py-3 px-4">{banner.clickCount ?? 0}</td>
                    <td className="py-3 px-4 break-all">{banner.destinationUrl}</td>
                    <td className="py-3 px-4">
                      <Badge className={banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {banner.isActive ? t("active") : t("inactive")}
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

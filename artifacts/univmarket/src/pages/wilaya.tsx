import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Package, Users, Star, TrendingUp } from "lucide-react";
import ServiceCard from "@/components/service-card";
import { useGetWilaya, useGetWilayaStats, useListServices } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

export default function WilayaPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/wilaya/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();

  const { data: wilaya, isLoading: wLoading } = useGetWilaya(id, { query: { enabled: !!id } });
  const { data: stats } = useGetWilayaStats(id, { query: { enabled: !!id } });
  const { data: services, isLoading: sLoading } = useListServices({ wilaya_id: id, limit: 12, status: "approved" });

  if (wLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    </div>
  );

  if (!wilaya) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p>{t("wilaya_not_found")}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="rounded-2xl gradient-teal text-white p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-extrabold opacity-20">{wilaya.code}</span>
              {wilaya.is_pilot && <Badge className="bg-accent/30 text-accent-foreground border-accent/50">{t("pilot_zone")}</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold">{wilaya.name_fr}</h1>
            {wilaya.name_ar && <p className="text-lg opacity-80 mt-1 font-serif" dir="rtl">{wilaya.name_ar}</p>}
            {wilaya.region && (
              <p className="flex items-center gap-1.5 mt-2 opacity-70 text-sm">
                <MapPin className="h-4 w-4" />{t("region")}: {wilaya.region}
              </p>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: t("active_services_label"), value: stats.active_services },
            { icon: Users, label: t("sellers_label"), value: stats.sellers_count },
            { icon: Star, label: t("avg_rating"), value: stats.avg_rating?.toFixed(1) ?? "N/A" },
            { icon: TrendingUp, label: t("orders"), value: stats.total_orders },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="card-hover">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Icon className="h-4 w-4" />{label}</div>
                <p className="text-2xl font-extrabold text-foreground">{value?.toLocaleString() ?? "-"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold">{t("services_in")} {wilaya.name_fr}</h2>
          <Button variant="outline" onClick={() => setLocation(`/search?wilaya_id=${id}`)}>{t("see_all")}</Button>
        </div>
        {sLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : !services?.data?.length ? (
          <Card><CardContent className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("no_services_wilaya")}</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.data.map((s: any) => <ServiceCard key={s.id} {...s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
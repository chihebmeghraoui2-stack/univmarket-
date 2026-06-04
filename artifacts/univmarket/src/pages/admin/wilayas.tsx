import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { MapPin, Users, Package, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function AdminWilayas() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: wilayas, isLoading } = useQuery({
    queryKey: ["admin-wilayas-stats"],
    queryFn: async () => {
      const res = await apifetch((import.meta.env.VITE_API_URL || "") + "/api/admin/wilayas/stats");
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("wilaya_stats_title")}</h1>
          <p className="text-xs text-muted-foreground">{t("wilaya_stats_desc")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(wilayas || [])
            .filter((w: any) => w.active_services > 0 || w.sellers_count > 0 || w.total_orders > 0)
            .sort((a: any, b: any) => b.total_orders - a.total_orders)
            .map((w: any) => (
              <div key={w.wilaya_id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{w.wilaya_name_fr}</p>
                    <p className="text-xs text-muted-foreground">{t("code_col")}: {w.wilaya_code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <Package className="h-3.5 w-3.5 text-teal-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{w.active_services}</p>
                    <p className="text-xs text-muted-foreground">{t("services")}</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-3.5 w-3.5 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{w.sellers_count}</p>
                    <p className="text-xs text-muted-foreground">{t("sellers_label")}</p>
                  </div>
                  <div className="text-center">
                    <ShoppingBag className="h-3.5 w-3.5 text-amber-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{w.total_orders}</p>
                    <p className="text-xs text-muted-foreground">{t("orders")}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {wilayas && wilayas.filter((w: any) => w.active_services === 0 && w.sellers_count === 0 && w.total_orders === 0).length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {wilayas.filter((w: any) => w.active_services === 0 && w.sellers_count === 0 && w.total_orders === 0).length} {t("wilayas_hidden")}
        </p>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2, TrendingUp, Star, ShoppingBag, Eye, Wallet } from "lucide-react";
import { useGetSellerStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function SellerAnalytics() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const { data: stats, isLoading } = useGetSellerStats({ period }, { query: { enabled: isSeller } });

  const kpis = stats ? [
    { icon: ShoppingBag, label: t("orders"), value: stats.total_orders, unit: "" },
    { icon: Wallet, label: t("monthly_revenue"), value: stats.revenue_total.toLocaleString(), unit: " DZD" },
    { icon: Star, label: t("avg_rating"), value: stats.avg_rating?.toFixed(1) ?? "N/A", unit: "" },
    { icon: Eye, label: t("total_views"), value: stats.total_views.toLocaleString(), unit: "" },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("analytics")}</h1>
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t("daily")}</SelectItem>
            <SelectItem value="weekly">{t("weekly")}</SelectItem>
            <SelectItem value="monthly">{t("monthly_period")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(({ icon: Icon, label, value, unit }) => (
            <Card key={label} className="card-hover">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Icon className="h-4 w-4" />{label}</div>
                <p className="text-2xl font-extrabold text-foreground">{value}{unit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{t("monthly_revenue")}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : stats?.revenue_chart ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.revenue_chart}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} DZD`, t("monthly_revenue")]} />
                  <Bar dataKey="value" fill="hsl(189,72%,30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">{t("no_data")}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" />{t("orders")}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : stats?.orders_chart ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.orders_chart}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [v, t("orders")]} />
                  <Line type="monotone" dataKey="value" stroke="hsl(38,95%,52%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">{t("no_data")}</p>}
          </CardContent>
        </Card>

        {stats?.top_services && stats.top_services.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{t("top_services_title")}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_services.map((svc: any, i: number) => (
                  <div key={svc.service_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                    <span className="text-lg font-extrabold text-muted-foreground/40 w-6 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{svc.title}</p>
                      <p className="text-xs text-muted-foreground">{svc.orders} {t("orders")}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{svc.revenue.toLocaleString()} DZD</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Package, ShoppingBag, Wallet, AlertTriangle, CheckCircle, TrendingUp, Globe, KeyRound, Megaphone, Star } from "lucide-react";
import { useGetAdminStats, useAdminGetAllWilayaStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: stats, isLoading } = useGetAdminStats({ period: "monthly" });
  const { data: wilayaStats } = useAdminGetAllWilayaStats();

  const kpis = stats ? [
    { icon: Users, label: t("admin_users"), value: stats.total_users, change: stats.new_users_today, changeLabel: t("new_today") },
    { icon: Package, label: t("services"), value: stats.total_services, change: stats.pending_services, changeLabel: t("pending") },
    { icon: ShoppingBag, label: t("orders"), value: stats.total_orders, change: stats.orders_today, changeLabel: t("today") },
    { icon: Wallet, label: t("volume_dzd"), value: stats.gmv_total?.toLocaleString() ?? "-", change: stats.commission_total, changeLabel: t("commission") },
    { icon: AlertTriangle, label: t("open_disputes"), value: stats.open_disputes, change: stats.disputes_resolved, changeLabel: t("resolved") },
    { icon: CheckCircle, label: t("completion_rate"), value: `${stats.completion_rate?.toFixed(1) ?? "-"}%`, change: null, changeLabel: "" },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("admin")}</h1>
        <p className="text-muted-foreground text-sm">{t("platform_overview")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: "/admin/users", icon: Users, label: t("admin_users") },
          { href: "/admin/services", icon: Package, label: t("services") },
          { href: "/admin/disputes", icon: AlertTriangle, label: t("disputes") },
          { href: "/admin/withdrawals", icon: Wallet, label: t("withdrawals") },
          { href: "/admin/wilayas", icon: Globe, label: t("wilayas_label") },
          { href: "/leaderboard", icon: TrendingUp, label: t("leaderboard") },
          { href: "/admin/product-archives", icon: Package, label: "Archives discussions" },
          { href: "/admin/password-resets", icon: KeyRound, label: "MDP Vendeurs" },
          { href: "/admin/broadcast", icon: Megaphone, label: "Broadcast" },
          { href: "/admin/trending-requests", icon: TrendingUp, label: "Produits Tendance" },
          { href: "/admin/featured-services", icon: Star, label: "Services à la une" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Card className="card-hover cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-semibold">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map(({ icon: Icon, label, value, change, changeLabel }) => (
            <Card key={label} className="card-hover">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Icon className="h-4 w-4" />{label}</div>
                <p className="text-2xl font-extrabold text-foreground">{value?.toLocaleString() ?? "-"}</p>
                {change != null && <p className="text-xs text-muted-foreground">{change.toLocaleString()} {changeLabel}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.revenue_chart && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t("monthly_revenue")} (DZD)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.revenue_chart}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} DZD`, ""]} />
                  <Bar dataKey="value" fill="hsl(189,72%,30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {stats?.orders_chart && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t("orders")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.orders_chart}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(38,95%,52%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {wilayaStats && wilayaStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />{t("activity_by_wilaya")}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">{t("wilaya")}</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("services")}</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("sellers_label")}</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("orders")}</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">{t("monthly_revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {wilayaStats.slice(0, 15).map((w: any) => (
                    <tr key={w.wilaya_id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2 font-medium">{w.wilaya_name_fr}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{w.active_services}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{w.sellers_count}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{w.total_orders}</td>
                      <td className="py-2 px-2 text-right font-semibold text-primary">{w.total_revenue?.toLocaleString()} DZD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
    </div>
  );
}
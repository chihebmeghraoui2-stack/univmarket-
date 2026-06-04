import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { ShoppingBag, Star, Wallet, Bell, Heart, BarChart2, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle, Plus } from "lucide-react";
import { useGetMe, useListOrders, useGetWallet, useListNotifications, useGetSellerStats, useGetWishlist } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user, isSeller } = useAuth();
  const [, setLocation] = useLocation();

  const { data: orders } = useListOrders({ limit: 5 });
  const { data: wallet } = useGetWallet({ query: { enabled: isSeller } });
  const { data: notifs } = useListNotifications({ limit: 5, unread_only: true });
  const { data: sellerStats } = useGetSellerStats({ period: "monthly" }, { query: { enabled: isSeller } });
  const { data: wishlist } = useGetWishlist();

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: t("status_pending"), color: "bg-amber-100 text-amber-700", icon: Clock },
    accepted: { label: t("status_accepted"), color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    in_progress: { label: t("status_in_progress"), color: "bg-purple-100 text-purple-700", icon: TrendingUp },
    delivered: { label: t("status_delivered"), color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    completed: { label: t("status_completed"), color: "bg-green-100 text-green-700", icon: CheckCircle },
    disputed: { label: t("status_disputed"), color: "bg-red-100 text-red-700", icon: AlertTriangle },
    cancelled: { label: t("status_cancelled"), color: "bg-gray-100 text-gray-500", icon: XCircle },
  };

  if (!user) { setLocation("/login"); return null; }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{t("dash_title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("hello")}, {user.name} ??</p>
        </div>
        <div className="flex gap-2">
            <Link href="/thesis-analyzer">
              <Button variant="outline" className="gap-2 border-teal-500 text-teal-700 hover:bg-teal-50">
                <Sparkles className="h-4 w-4" /> Analyseur IA Memoire
              </Button>
            </Link>
            {isSeller && (
            <Link href="/seller/services">
              <Button className="gradient-teal text-white border-none gap-2">
                <Plus className="h-4 w-4" /> {t("new_service")}
              </Button>
            </Link>
            )}
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><ShoppingBag className="h-4 w-4" />{t("orders")}</div>
          <p className="text-2xl font-extrabold">{orders?.total ?? "-"}</p>
        </CardContent></Card>
        {isSeller ? (<>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Wallet className="h-4 w-4" />{t("balance")}</div>
            <p className="text-2xl font-extrabold text-primary">{wallet ? `${wallet.balance.toLocaleString()} DZD` : "-"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Star className="h-4 w-4" />{t("avg_rating")}</div>
            <p className="text-2xl font-extrabold">{sellerStats?.avg_rating?.toFixed(1) ?? "-"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><TrendingUp className="h-4 w-4" />{t("monthly_revenue")}</div>
            <p className="text-2xl font-extrabold">{sellerStats ? `${sellerStats.revenue_total.toLocaleString()} DZD` : "-"}</p>
          </CardContent></Card>
        </>) : (<>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Heart className="h-4 w-4" />{t("favorites")}</div>
            <p className="text-2xl font-extrabold">{wishlist?.length ?? "-"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Bell className="h-4 w-4" />{t("notifications")}</div>
            <p className="text-2xl font-extrabold">{notifs?.unread_count ?? "-"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Star className="h-4 w-4" />{t("trust_score")}</div>
            <p className="text-2xl font-extrabold">{user.trust_score ?? "N/A"}</p>
          </CardContent></Card>
        </>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t("recent_orders")}</CardTitle>
            <Link href="/orders"><Button variant="ghost" size="sm" className="text-xs">{t("see_all")}</Button></Link>
          </CardHeader>
          <CardContent>
            {!orders?.data?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                {t("no_orders")}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.data.map((order: any) => {
                  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-500", icon: Clock };
                  const Icon = cfg.icon;
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">#{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.total_price.toLocaleString()} DZD</p>
                        </div>
                        <Badge className={`text-xs shrink-0 ${cfg.color} border-none`}>{cfg.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isSeller && wallet && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{t("wallet")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t("available")}</p>
                  <p className="text-xl font-extrabold text-primary">{wallet.balance.toLocaleString()} DZD</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("pending")}: {wallet.pending_balance.toLocaleString()} DZD</p>
                <Link href="/seller/wallet">
                  <Button size="sm" variant="outline" className="w-full text-xs">{t("manage_wallet")}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />{t("notifications")}</CardTitle>
              <Link href="/notifications"><Button variant="ghost" size="sm" className="text-xs">{t("see_all")}</Button></Link>
            </CardHeader>
            <CardContent>
              {!notifs?.data?.length ? (
                <p className="text-xs text-muted-foreground text-center py-2">{t("no_notifications")}</p>
              ) : (
                <div className="space-y-2">
                  {notifs.data.slice(0, 3).map((n: any) => (
                    <div key={n.id} className="text-xs p-2 rounded-lg bg-muted/40">
                      <p className="font-medium">{n.title}</p>
                      {n.body && <p className="text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {isSeller && sellerStats?.revenue_chart?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary" />{t("monthly_revenue")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={sellerStats.revenue_chart.slice(-7)}>
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()} DZD`, ""]} />
                    <Bar dataKey="value" fill="hsl(189 72% 30%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
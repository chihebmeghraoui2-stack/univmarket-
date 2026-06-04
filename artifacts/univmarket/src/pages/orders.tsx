import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function Orders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user, isSeller } = useAuth();
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState<"client" | "seller">(isSeller ? "seller" : "client");
  const [page, setPage] = useState(1);

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: t("status_pending"), color: "bg-amber-100 text-amber-700 border-amber-200" },
    accepted: { label: t("status_accepted"), color: "bg-blue-100 text-blue-700 border-blue-200" },
    in_progress: { label: t("status_in_progress"), color: "bg-purple-100 text-purple-700 border-purple-200" },
    delivered: { label: t("status_delivered"), color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    completed: { label: t("status_completed"), color: "bg-green-100 text-green-700 border-green-200" },
    disputed: { label: t("status_disputed"), color: "bg-red-100 text-red-700 border-red-200" },
    cancelled: { label: t("status_cancelled"), color: "bg-gray-100 text-gray-500 border-gray-200" },
    refunded: { label: t("status_refunded"), color: "bg-orange-100 text-orange-700 border-orange-200" },
  };

  const { data: orders, isLoading } = useListOrders({
    status: status !== "all" ? status : undefined,
    role, page, limit: 20,
  });

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground">{t("login_to_see")} {t("your_orders")}</p>
      <Link href="/login"><Button className="mt-4">{t("login")}</Button></Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("my_orders")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders?.total ?? 0} {t("orders_total")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isSeller && (
          <Tabs value={role} onValueChange={v => { setRole(v as any); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="client">{t("as_client")}</TabsTrigger>
              <TabsTrigger value="seller">{t("as_seller")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_statuses")}</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !orders?.data?.length ? (
        <Card><CardContent className="py-16 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold mb-2">{t("no_orders")}</h3>
          <p className="text-sm text-muted-foreground">{status !== "all" ? t("no_orders_status") : t("search_service")}</p>
          <Link href="/search"><Button className="mt-4 gradient-teal text-white border-none">{t("explore_services")}</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {orders.data.map((order: any) => {
            const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-500" };
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">#{order.id}</p>
                          <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-primary">{order.total_price.toLocaleString()} DZD</p>
                        <p className="text-xs text-muted-foreground">{t("commission")}: {order.commission_amount.toLocaleString()} DZD</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {orders && orders.total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
          <span className="text-sm text-muted-foreground">{t("page")} {page} / {Math.ceil(orders.total / 20)}</span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(orders.total / 20)}>{t("next")}</Button>
        </div>
      )}
    </div>
  );
}
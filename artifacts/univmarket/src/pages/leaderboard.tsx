import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, CheckCircle, MapPin } from "lucide-react";
import { useGetLeaderboard, useListWilayas } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

export default function Leaderboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [wilayaId, setWilayaId] = useState("all");
  const [period, setPeriod] = useState<"monthly" | "all_time">("monthly");
  const { data: _wRaw } = useListWilayas();
  const wilayas: any[] = Array.isArray(_wRaw) ? _wRaw : (_wRaw as any)?.value ?? [];
  const { data: _leadersRaw, isLoading } = useGetLeaderboard({
    wilaya_id: wilayaId !== "all" ? Number(wilayaId) : undefined,
    period, limit: 20,
  });
  const leaders: any[] = Array.isArray(_leadersRaw) ? _leadersRaw : (_leadersRaw as any)?.value ?? [];

  const RANK_STYLE = [
    "bg-amber-50 border-amber-200",
    "bg-slate-50 border-slate-200",
    "bg-orange-50 border-orange-200",
  ];
  const RANK_TROPHY = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-accent" /> {t("leaderboard_title")}
        </h1>
        <p className="text-muted-foreground">{t("leaderboard_desc")}</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Select value={wilayaId} onValueChange={setWilayaId}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("all_wilayas")} /></SelectTrigger>
          <SelectContent className="max-h-40 overflow-y-auto">
            <SelectItem value="all">{t("all_wilayas")}</SelectItem>
            {[...wilayas].sort((a, b) => parseInt(a.code) - parseInt(b.code)).map((w: any) => <SelectItem key={w.id} value={String(w.id)}>{w.code} - {w.name_fr}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{t("this_month")}</SelectItem>
            <SelectItem value="all_time">{t("all_time")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !leaders?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t("no_leaders")}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {leaders.map((seller: any, i: number) => (
            <Card key={seller.seller_id} className={`border ${i < 3 ? RANK_STYLE[i] : ""} hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-extrabold w-8 text-center shrink-0">
                    {i < 3 ? RANK_TROPHY[i] : <span className="text-base text-muted-foreground font-bold">#{i + 1}</span>}
                  </div>
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={seller.avatar ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{seller.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{seller.name}</span>
                      {seller.verified && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {seller.wilaya_name_fr && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{seller.wilaya_name_fr}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{seller.avg_rating?.toFixed(1) ?? "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-primary">{seller.total_revenue?.toLocaleString()} DZD</p>
                    <p className="text-xs text-muted-foreground">{seller.orders_count} {t("orders")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
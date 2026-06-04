import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Award, Star, Search, Check, X, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminFeaturedServices() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => { if (!isAdmin) setLocation("/"); }, [isAdmin]);

  const fetchServices = async (query = search) => {
    setLoading(true); setSearched(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/services/all?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("load_error"));
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e: any) {
      toast({ title: e?.message ?? t("order_error"), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const toggleFeatured = async (id: number, current: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/services/${id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ is_featured: !current }),
      });
      if (!res.ok) throw new Error();
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_featured: !current } : s));
      toast({ title: !current ? t("added_to_featured") : t("removed_from_featured") });
    } catch { toast({ title: t("order_error"), variant: "destructive" }); }
    finally { setUpdating(null); }
  };

  const featured = services.filter(s => s.is_featured);
  const notFeatured = services.filter(s => !s.is_featured);

  return (
    <div className="min-h-screen bg-gray-50/50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("featured_title")}</h1>
            <p className="text-xs text-muted-foreground">{t("featured_admin_desc")}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
            <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{featured.length} {t("featured_title")}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchServices()}
              placeholder={t("search_service")} className="pl-9 rounded-xl" />
          </div>
          <Button onClick={() => fetchServices()} disabled={loading} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-6">
            {loading ? "..." : t("search")}
          </Button>
          <Button onClick={() => { setSearch(""); fetchServices(""); }} variant="outline" className="rounded-xl">{t("see_all")}</Button>
        </div>

        {loading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>}

        {!loading && searched && services.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>{t("no_results")}</p>
          </div>
        )}

        {!loading && featured.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-amber-700 flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              {t("currently_featured")} ({featured.length})
            </h2>
            {featured.map(s => <ServiceRow key={s.id} s={s} onToggle={toggleFeatured} updating={updating} t={t} />)}
          </div>
        )}

        {!loading && featured.length > 0 && notFeatured.length > 0 && (
          <div className="border-t border-dashed border-gray-200 pt-4">
            <h2 className="text-sm font-bold text-muted-foreground mb-3">{t("other_services")} ({notFeatured.length})</h2>
          </div>
        )}

        {!loading && notFeatured.length > 0 && (
          <div className="space-y-3">
            {notFeatured.map(s => <ServiceRow key={s.id} s={s} onToggle={toggleFeatured} updating={updating} t={t} />)}
          </div>
        )}

        {!searched && (
          <div className="py-20 text-center text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">{t("click_all_to_see")}</p>
            <p className="text-xs mt-1">{t("or_search_by_title")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceRow({ s, onToggle, updating, t }: any) {
  return (
    <div className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-all ${s.is_featured ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}>
      <div className="flex items-start gap-4">
        {s.images?.[0] ? (
          <img src={s.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-900 truncate">{s.title_fr ?? s.title}</p>
            {s.is_featured && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {t("featured_title")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs rounded-full">{s.category_name_fr ?? s.category}</Badge>
            <span className="text-xs text-muted-foreground">{t("by_seller")} <span className="font-medium text-gray-700">{s.seller_name}</span></span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{s.price?.toLocaleString()} DZD</span>
            <span className="text-xs text-muted-foreground">{s.views_count ?? 0} {t("views_count")}</span>
          </div>
        </div>
        <Button size="sm" disabled={updating === s.id} onClick={() => onToggle(s.id, s.is_featured)}
          className={`shrink-0 rounded-xl h-9 px-4 text-xs font-semibold gap-1.5 ${s.is_featured ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
          variant={s.is_featured ? "outline" : "default"}>
          {updating === s.id ? "..." : s.is_featured
            ? <><X className="h-3.5 w-3.5" /> {t("remove")}</>
            : <><Check className="h-3.5 w-3.5" /> {t("set_featured")}</>}
        </Button>
      </div>
    </div>
  );
}
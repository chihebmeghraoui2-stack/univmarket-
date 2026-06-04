import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }  from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ServiceCard from "@/components/service-card";
import { useSearchServices, useListWilayas, useListCategories } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

function getSearchParam(key: string) {
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  const [q, setQ] = useState(getSearchParam("q"));
  const [wilayaId, setWilayaId] = useState(getSearchParam("wilaya_id") || "all");
  const [categoryId, setCategoryId] = useState(getSearchParam("category_id") || "all");
  const [sort, setSort] = useState(getSearchParam("sort") || "relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: wilayasData } = useListWilayas();
  const wilayas: any[] = Array.isArray(wilayasData) ? wilayasData : (wilayasData as any)?.value ?? [];
  const { data: _cRaw } = useListCategories();
  const categories: any[] = Array.isArray(_cRaw) ? _cRaw : (_cRaw as any)?.value ?? [];

  const searchParams = {
    q: q || undefined,
    wilaya_id: wilayaId !== "all" ? Number(wilayaId) : undefined,
    category_id: categoryId !== "all" ? Number(categoryId) : undefined,
    sort: sort as any,
    min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
    max_price: priceRange[1] < 100000 ? priceRange[1] : undefined,
    min_rating: minRating !== "any" ? Number(minRating) : undefined,
    verified_only: verifiedOnly || undefined,
    page, limit: 20,
  };

  const { data: _resultsRaw, isLoading } = useSearchServices(searchParams);
  const [smartData, setSmartData] = useState<any>(null);
  const [corrected, setCorrected] = useState<string | null>(null);

  useEffect(() => {
    if (!q) { setSmartData(null); setCorrected(null); return; }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (wilayaId !== "all") params.set("wilaya_id", wilayaId);
        if (categoryId !== "all") params.set("category_id", categoryId);
        const res = await fetch(`/api/services/smart-search?${params}`);
        const data = await res.json();
        setSmartData(data);
        setCorrected(data.corrected_query);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [q, wilayaId, categoryId]);
  const results: any = Array.isArray(_resultsRaw) ? { data: _resultsRaw, total: _resultsRaw.length } : _resultsRaw;

  const clearFilters = () => {
    setWilayaId("all"); setCategoryId("all"); setSort("relevance");
    setPriceRange([0, 100000]); setMinRating("any"); setVerifiedOnly(false); setPage(1);
  };

  const hasActiveFilters = wilayaId !== "all" || categoryId !== "all" || priceRange[0] > 0 || priceRange[1] < 100000 || minRating !== "any" || verifiedOnly;
  const items: any[] = Array.isArray(results) ? results : results?.data ?? results?.value ?? [];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-card border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <form onSubmit={e => { e.preventDefault(); setPage(1); }} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t("search_service")} className="pl-9" />
            </div>
            <Button type="submit" className="gradient-teal text-white border-none">{t("search")}</Button>
            <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">{t("filters")}</span>
              {hasActiveFilters && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">!</Badge>}
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className={`${showFilters ? "block" : "hidden"} lg:block w-64 shrink-0 space-y-5`}>
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t("filters")}</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground h-7">
                    <X className="h-3 w-3 mr-1" /> {t("clear")}
                  </Button>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("wilaya")}</label>
                <Select value={wilayaId} onValueChange={v => { setWilayaId(v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">{t("all_wilayas_filter")}</SelectItem>
                    {[...wilayas].sort((a, b) => parseInt(a.code) - parseInt(b.code)).map((w: any) => <SelectItem key={w.id} value={String(w.id)}>{w.code} - {w.name_fr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("category")}</label>
                <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">{t("all_categories")}</SelectItem>
                    {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name_fr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("sort_by")}</label>
                <Select value={sort} onValueChange={v => { setSort(v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="relevance">{t("relevance")}</SelectItem>
                    <SelectItem value="newest">{t("newest")}</SelectItem>
                    <SelectItem value="top_rated">{t("top_rated")}</SelectItem>
                    <SelectItem value="price_asc">{t("price_asc")}</SelectItem>
                    <SelectItem value="price_desc">{t("price_desc")}</SelectItem>
                    <SelectItem value="most_popular">{t("most_popular")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("price")}: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} DZD
                </label>
                <Slider value={priceRange} onValueChange={v => setPriceRange(v as [number, number])} min={0} max={100000} step={500} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("min_rating")}</label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="any">{t("all_ratings")}</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="rounded text-primary" />
                <span className="text-xs font-medium">{t("verified_only")}</span>
              </label>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4">
              {results && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.total ?? items.length}</span> {t("results")}
                  {q && <span> {t("for")} "<span className="text-primary">{q}</span>"</span>}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/9]" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{t("no_results")}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t("no_results_desc")}</p>
                <Button variant="outline" onClick={clearFilters}>{t("clear_filters")}</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((s: any) => <ServiceCard key={s.id} {...s} />)}
                </div>
                {results?.total > 20 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
                    <span className="text-sm text-muted-foreground">{t("page")} {page} / {Math.ceil(results.total / 20)}</span>
                    <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(results.total / 20)}>{t("next")}</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
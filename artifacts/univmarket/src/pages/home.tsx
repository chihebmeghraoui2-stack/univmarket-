import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, CheckCircle, Globe, TrendingUp, Star, Users, ShoppingBag, Award } from "lucide-react";
import ServiceCard from "@/components/service-card";
import { useTranslation } from "react-i18next";
import {
  useGetPlatformStats, useListWilayas, useGetFeaturedServices,
  useGetTrendingServices, useGetPopularCategories, useGetRecentServices,
} from "@workspace/api-client-react";

const CATEGORY_ICONS: Record<string, string> = {
  "dev-web": "💻", "design": "🎨", "traduction": "📤", "redaction": "📝",
  "marketing": "📹", "informatique": "🖥", "tutorat": "👫", "frontend": "💻",
  "backend": "💻", "logo": "🎨", "these": "🎓", "ppt": "📹", "saisie": "⌨️", "autre": "🖥",
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [searchWilaya, setSearchWilaya] = useState("all");

  const { data: stats } = useGetPlatformStats();
  const { data: wilayas } = useListWilayas();
  const { data: featured } = useGetFeaturedServices({ limit: 8 });
  const { data: trending } = useGetTrendingServices({ limit: 8 });
  const { data: popularCats } = useGetPopularCategories({ limit: 10 });
  const { data: recent } = useGetRecentServices({ limit: 12 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQ) params.set("q", searchQ);
    if (searchWilaya !== "all") params.set("wilaya_id", searchWilaya);
    setLocation(`/search?${params.toString()}`);
  };

  const pilotWilayas = wilayas?.filter(w => w.is_pilot) ?? [];
  const allWilayas = [...(wilayas ?? [])].sort((a, b) => Number(a.code) - Number(b.code));
  const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero text-white py-20 px-4">
        <div className="absolute inset-0 opacity-40" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 backdrop-blur text-sm px-3 py-1">
                🇩🇿 {t("hero_badge")}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                {t("hero_title")} <br className="hidden md:block" />
                <span className="text-accent">{t("hero_title_accent")}</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("hero_subtitle")}</p>
            </div>
          </motion.div>

          <motion.form initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.2 }}
            onSubmit={handleSearch}
            className="bg-card/20 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto shadow-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input placeholder={t("hero_search_placeholder")} value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11" />
            </div>
            <Select value={searchWilaya} onValueChange={setSearchWilaya}>
              <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white h-11">
                <SelectValue placeholder={t("wilaya")} />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                <SelectItem value="all">{t("all_wilayas")}</SelectItem>
                {allWilayas.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.code} - {w.name_fr}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" className="h-11 px-8 bg-accent hover:bg-accent/90 font-semibold shrink-0">
              {t("search")}
            </Button>
          </motion.form>

          {pilotWilayas.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
              <span className="text-xs text-white/50">{t("beta_available_in")}:</span>
              {pilotWilayas.map(w => (
                <button key={w.id} onClick={() => setLocation(`/wilaya/${w.id}`)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 border border-white/20">
                  {w.name_fr}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="bg-primary text-primary-foreground py-5 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Users, label: t("active_sellers"), value: stats?.active_sellers?.toLocaleString() ?? "…" },
            { icon: ShoppingBag, label: t("available_services"), value: stats?.total_services?.toLocaleString() ?? "…" },
            { icon: Globe, label: t("wilayas_covered"), value: stats?.wilayas_covered ?? "…" },
            { icon: CheckCircle, label: t("completed_orders"), value: stats?.orders_completed?.toLocaleString() ?? "…" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="h-5 w-5 opacity-70" />
              <span className="text-2xl font-extrabold">{value}</span>
              <span className="text-xs opacity-70">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WILAYA CHIPS */}
      <section className="py-8 px-4 bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">{t("browse_by_wilaya")}</h2>
          <div className="flex gap-2 pb-2 overflow-x-auto">
            {allWilayas.map(w => (
              <button key={w.id} onClick={() => setLocation(`/wilaya/${w.id}`)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border bg-card hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap">
                {w.code} {w.name_fr}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16 py-12">
        {/* FEATURED */}
        {featured && featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title flex items-center gap-2"><Award className="h-5 w-5 text-accent" /> {t("featured_title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("featured_subtitle")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/search?featured=true")}>{t("see_all")}</Button>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map(s => <motion.div key={s.id} variants={fadeUp}><ServiceCard {...s} /></motion.div>)}
            </motion.div>
          </section>
        )}

        {/* POPULAR CATEGORIES */}
        {popularCats && popularCats.length > 0 && (
          <section>
            <h2 className="section-title mb-6">{t("popular_categories")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {popularCats.map((cat, idx) => {
                const colorSets = [
                  { bar: "#185FA5", bg: "rgba(24,95,165,0.1)", ic: "#185FA5", icon: "ti-chart-bar" },
                  { bar: "#534AB7", bg: "rgba(83,74,183,0.1)", ic: "#534AB7", icon: "ti-language" },
                  { bar: "#993556", bg: "rgba(153,53,86,0.1)", ic: "#993556", icon: "ti-palette" },
                  { bar: "#0F6E56", bg: "rgba(15,110,86,0.1)", ic: "#0F6E56", icon: "ti-code" },
                  { bar: "#888780", bg: "rgba(136,135,128,0.1)", ic: "#888780", icon: "ti-dots" },
                  { bar: "#854F0B", bg: "rgba(133,79,11,0.1)", ic: "#854F0B", icon: "ti-keyboard" },
                  { bar: "#993C1D", bg: "rgba(153,60,29,0.1)", ic: "#993C1D", icon: "ti-presentation" },
                  { bar: "#3B6D11", bg: "rgba(59,109,17,0.1)", ic: "#3B6D11", icon: "ti-school" },
                  { bar: "#3C3489", bg: "rgba(60,52,137,0.1)", ic: "#3C3489", icon: "ti-book" },
                  { bar: "#A32D2D", bg: "rgba(163,45,45,0.1)", ic: "#A32D2D", icon: "ti-file-check" },
                ];
                const c = colorSets[idx % colorSets.length];
                return (
                  <button key={cat.id} onClick={() => setLocation(`/search?category_id=${cat.id}`)}
                    style={{ position: "relative", background: "var(--card)", border: "0.5px solid var(--border)", borderRadius: "16px", padding: "22px 10px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "pointer", overflow: "hidden", transition: "transform 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                    <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: c.bar, borderRadius: "16px 16px 0 0" }} />
                    <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: c.ic }}>
                      <i className={`ti ${c.icon}`} aria-hidden="true" />
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)", textAlign: "center", lineHeight: 1.3 }}>{cat.name_fr}</span>
                    <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px", background: "var(--muted)", color: "var(--muted-foreground)" }}>{cat.services_count} {t("services")}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* TRENDING */}
        {trending && trending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> {t("trending_title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("trending_subtitle")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/search?sort=most_popular")}>{t("see_all")}</Button>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.map(s => <motion.div key={s.id} variants={fadeUp}><ServiceCard {...s} /></motion.div>)}
            </motion.div>
          </section>
        )}

        {/* EXPLORE BY WILAYA */}
        {allWilayas.length > 0 && (
          <section>
            <h2 className="section-title mb-6">{t("explore_by_wilaya")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allWilayas.slice(0, 24).map(w => (
                <button key={w.id} onClick={() => setLocation(`/wilaya/${w.id}`)}
                  className="group p-3 rounded-xl border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">{w.code}</span>
                    {w.is_pilot && <Badge className="text-xs px-1 py-0 h-4 bg-accent/20 text-accent border-accent/30">Beta</Badge>}
                  </div>
                  <p className="font-semibold text-xs group-hover:text-primary transition-colors truncate">{w.name_fr}</p>
                </button>
              ))}
            </div>
            {allWilayas.length > 24 && (
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => setLocation("/search")}>{t("see_58_wilayas")}</Button>
              </div>
            )}
          </section>
        )}

        {/* RECENT */}
        {recent && recent.data.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">{t("recent_services")}</h2>
              <Button variant="outline" size="sm" onClick={() => setLocation("/search?sort=newest")}>{t("see_all")}</Button>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.data.map(s => <motion.div key={s.id} variants={fadeUp}><ServiceCard {...s} /></motion.div>)}
            </motion.div>
          </section>
        )}

        {/* TRUST */}
        <section className="rounded-2xl bg-primary/5 border border-primary/20 p-8">
          <h2 className="section-title text-center mb-8">{t("why_univmarket")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: t("trust_escrow"), desc: t("trust_escrow_desc") },
              { icon: CheckCircle, title: t("trust_verified"), desc: t("trust_verified_desc") },
              { icon: Globe, title: t("trust_wilayas"), desc: t("trust_wilayas_desc") },
              { icon: Star, title: t("trust_law"), desc: t("trust_law_desc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

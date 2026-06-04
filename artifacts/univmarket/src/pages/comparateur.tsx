import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ComparateurPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any[]>([]);

  const { data: results, isLoading } = useQuery<any[]>({
    queryKey: ["comparateur-search", query],
    queryFn: async () => {
      if (!query) return [];
      const res = await fetch(`/api/services?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(t("search_error"));
      return res.json();
    },
    enabled: query.length > 1,
  });

  const canAdd = useMemo(() => selected.length < 3, [selected.length]);

  const handleAdd = (service: any) => {
    if (selected.some(item => item.id === service.id)) { toast({ title: t("already_added") }); return; }
    if (!canAdd) { toast({ title: t("limit_reached"), description: t("compare_limit_desc") }); return; }
    setSelected(prev => [...prev, service]);
  };

  const handleRemove = (id: number) => setSelected(prev => prev.filter(s => s.id !== id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-widest text-primary">{t("comparator")}</p>
        <h1 className="text-3xl font-bold">{t("compare_title")}</h1>
        <p className="text-muted-foreground">{t("compare_desc")}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("search_service")} />
            <Button onClick={() => setQuery(query)} disabled={!query}>{t("search")}</Button>
          </div>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-12 rounded-lg" /><Skeleton className="h-12 rounded-lg" /></div>
          ) : query ? (
            <div className="grid gap-3">
              {results?.slice(0, 6).map(service => (
                <Card key={service.id} className="border">
                  <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto] items-center pt-4">
                    <div>
                      <p className="font-semibold">{service.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.seller_name} {service.seller_verified && `• ${t("verified_seller")}`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAdd(service)}>{t("add")}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("type_to_search")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("comparison_table")}</CardTitle></CardHeader>
        <CardContent>
          {selected.length < 2 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center text-muted-foreground">
              {t("add_two_services")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-3 px-4 text-left">{t("feature")}</th>
                    {selected.map(s => <th key={s.id} className="py-3 px-4 text-left">{s.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: t("image_label"), render: (s: any) => <img src={s.image_url ?? "/placeholder.png"} alt={s.title} className="h-16 w-24 rounded-md object-cover" /> },
                    { label: t("service_title"), render: (s: any) => s.title },
                    { label: t("seller_label"), render: (s: any) => <>{s.seller_name} {s.seller_verified && <Badge>{t("verified")}</Badge>}</> },
                    { label: t("wilaya"), render: (s: any) => s.wilaya },
                    { label: t("price"), render: (s: any) => `${s.price?.toLocaleString()} DZD` },
                    { label: t("delivery_days"), render: (s: any) => `${s.delivery_days} ${t("day")}` },
                    { label: t("avg_rating"), render: (s: any) => `${s.average_rating?.toFixed(1)} (${s.review_count})` },
                    { label: t("category"), render: (s: any) => s.category },
                  ].map(({ label, render }) => (
                    <tr key={label} className="border-b">
                      <td className="py-3 px-4 font-semibold">{label}</td>
                      {selected.map(s => <td key={s.id} className="py-3 px-4">{render(s)}</td>)}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 px-4 font-semibold">{t("actions_col")}</td>
                    {selected.map(s => (
                      <td key={s.id} className="py-3 px-4 space-y-2">
                        <Link href={`/services/${s.id}`}>
                          <Button variant="outline" size="sm">{t("order_now")}</Button>
                        </Link>
                        <Button variant="secondary" size="sm" onClick={() => handleRemove(s.id)}>{t("remove")}</Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
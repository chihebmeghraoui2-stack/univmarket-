import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apifetch((import.meta.env.VITE_API_URL || "") + "/api/categories");
      if (!res.ok) throw new Error("Erreur categories");
      const d = await res.json(); return [...d].sort((a:any,b:any)=>Number(a.code)-Number(b.code));
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: wilayas = [], isLoading: wilayasLoading } = useQuery<any[]>({
    queryKey: ["/api/wilayas"],
    queryFn: async () => {
      const res = await apifetch((import.meta.env.VITE_API_URL || "") + "/api/wilayas");
      if (!res.ok) throw new Error("Erreur wilayas");
      const d = await res.json(); return [...d].sort((a:any,b:any)=>Number(a.code)-Number(b.code));
    },
    staleTime: 1000 * 60 * 10,
  });

  const queryKey = ["/api/products", wilayaId, categoryId, minPrice, maxPrice];
  const { data: products = [], isLoading, isError } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (wilayaId) params.set("wilayaId", String(wilayaId));
      if (categoryId) params.set("categoryId", String(categoryId));
      if (minPrice) params.set("minPrice", String(minPrice));
      if (maxPrice) params.set("maxPrice", String(maxPrice));
      const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Erreur produits");
      const d = await res.json(); return [...d].sort((a:any,b:any)=>Number(a.code)-Number(b.code));
    },
    keepPreviousData: true,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">{t("products")}</h1>
          <p className="text-sm text-muted-foreground">{t("browse_products")}</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:grid-cols-4">
          <Select value={String(wilayaId ?? "")} onValueChange={(value) => setWilayaId(value ? Number(value) : null)}>
            <option value="">{t("all_wilayas")}</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.id} value={wilaya.id}>{`${wilaya.code} - ${wilaya.name_fr ?? wilaya.name}`}</option>
            ))}
          </Select>
          <Select value={categoryId ?? ""} onValueChange={(value) => setCategoryId(value ? Number(value) : null)}>
            <option value="">{t("all_categories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name_fr ?? category.name}</option>
            ))}
          </Select>
          <Input type="number" min={0} value={minPrice || ""} onChange={(e) => setMinPrice(Number(e.target.value) || 0)} placeholder={t("min_price")} />
          <Input type="number" min={0} value={maxPrice || ""} onChange={(e) => setMaxPrice(Number(e.target.value) || 0)} placeholder={t("max_price")} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse h-72" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Erreur de chargement des produits.</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-700">Aucun produit trouvأ©.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group cursor-pointer overflow-hidden transition hover:-translate-y-1">
                <div className="h-52 overflow-hidden bg-slate-100">
                  <img src={product.coverPhoto} alt={product.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold truncate">{product.title}</h2>
                    <span className="text-sm font-semibold text-foreground">{Number(product.price).toLocaleString()} DZD</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.seller?.name ?? "Vendeur inconnu"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{product.wilaya?.nameFr ?? "--"}</Badge>
                    {product.seller?.verifiedAt ? <Badge variant="outline">Vأ©rifiأ©</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


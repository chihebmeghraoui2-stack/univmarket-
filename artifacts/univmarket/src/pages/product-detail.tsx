import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, MapPin, Navigation } from "lucide-react";
import { Link } from "wouter";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import { useTranslation } from "react-i18next";

export default function ProductDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/products/:id");
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [chatId, setChatId] = useState<number | null>(null);

  const productId = params?.id ? Number(params.id) : null;

  const { data: product, isLoading, isError } = useQuery<any>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await apiFetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Produit introuvable");
      return res.json();
    },
    enabled: Boolean(productId),
  });

  const { data: chats = [] } = useQuery<any[]>({
    queryKey: ["productChats"],
    queryFn: async () => {
      const res = await apiFetch("/api/product-chats");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });

  const contactMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/products/${productId}/contact`, { method: "POST" });
      if (!res.ok) throw new Error("Impossible de démarrer le chat");
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/product-chat/${data.chatId}`);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de contacter le vendeur.", variant: "destructive" });
    },
  });

  const existingChat = chats.find((chat) => chat.product?.id === productId);

  const images = product ? [product.coverPhoto, ...(product.photos || []).filter((photo: string) => photo !== product.coverPhoto)] : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products"><ArrowLeft className="mr-2 h-4 w-4" />{t("back_to_products")}</Link>
          </Button>
          <h1 className="text-3xl font-extrabold">{product?.title ?? "Produit"}</h1>
        </div>
        {/* Bouton localisation GPS */}
      {product?.location && (() => {
        try {
          const loc = JSON.parse(product.location);
          if (!loc?.lat || !loc?.lng) return null;
          return (
            <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Localisation de l'événement</p>
                  <p className="text-sm text-muted-foreground truncate">{loc.address}</p>
                </div>
                <a
                  href={"https://www.google.com/maps?q=" + loc.lat + "," + loc.lng}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Navigation className="h-4 w-4" />
                  Ouvrir GPS
                </a>
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {existingChat ? (
          <Button onClick={() => setLocation(`/product-chat/${existingChat.id}`)}>{t("continue_discussion")}</Button>
        ) : isAuthenticated ? (
          <Button onClick={() => contactMutation.mutate()} disabled={contactMutation.isLoading || !product}>
            {contactMutation.isLoading ? "Création du chat..." : "📞 Contacter le vendeur"}
          </Button>
        ) : (
          <Button onClick={() => setLocation("/login")}>{t("login_to_contact")}</Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="h-[420px] rounded-3xl" />
        </div>
      ) : isError || !product ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Produit introuvable.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid gap-3">
              {images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((photo: string, index: number) => (
                    <div key={index} className="overflow-hidden rounded-3xl bg-slate-100">
                      <img src={photo} alt={`${product.title} ${index + 1}`} className="h-72 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-72 rounded-3xl bg-slate-100" />
              )}
            </div>

            <Card>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{product.wilaya?.nameFr}</p>
                    <h2 className="text-2xl font-semibold">{product.title}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prix</p>
                    <p className="text-3xl font-extrabold text-foreground">{Number(product.price).toLocaleString()} DZD</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t("description")}</p>
                    <p className="text-sm leading-7 text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t("views")}</p>
                    <p className="text-sm text-muted-foreground">{product.views ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-100">
                    {product.seller?.avatar ? <img src={product.seller.avatar} alt={product.seller.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl text-slate-400">{product.seller?.name?.charAt(0) ?? "?"}</div>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("vendeur")}</p>
                    <p className="text-lg font-semibold">{product.seller?.name}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{product.wilaya?.nameFr}</Badge>
                    {product.seller?.verifiedAt ? <Badge variant="outline">Vérifié</Badge> : null}
                  </div>
                  <TrustScoreBadge score={Number(product.seller?.trustScore ?? 0)} showLabel={false} />
                </div>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">{t("seller_bio")}</p>
                  <p className="text-sm text-slate-700">{product.seller?.bio ?? t("no_bio")}</p>
                </div>
                {product.seller?.phone ? (
                  <a href={`tel:${product.seller.phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <ExternalLink className="h-4 w-4" /> {product.seller.phone}
                  </a>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

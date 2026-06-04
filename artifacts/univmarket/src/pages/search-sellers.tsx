import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Shield, Star, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function SearchSellersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: sellers, isLoading } = useQuery({
    queryKey: ["/api/sellers/search", search],
    queryFn: async () => {
      if (!search) return [];
      const res = await fetch(`/api/sellers/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data?.data ?? data?.sellers ?? [];
    },
    enabled: search.length >= 2,
  });

  const canContact = user?.role === "seller";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Search className="h-6 w-6 text-primary" />{t("search_seller")}
      </h1>

      <div className="flex gap-2">
        <Input placeholder={t("seller_search_placeholder")} value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && setSearch(q)}
          className="flex-1" />
        <Button onClick={() => setSearch(q)} disabled={q.length < 2}>
          <Search className="h-4 w-4 mr-2" /> {t("search")}
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {sellers?.length === 0 && search && !isLoading && (
        <p className="text-center text-muted-foreground py-8">{t("no_seller_found")} "{search}"</p>
      )}

      <div className="space-y-3">
        {sellers?.map((seller: any) => (
          <Card key={seller.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                    {seller.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{seller.name}</p>
                    {seller.verified && (
                      <Badge className="bg-green-100 text-green-800 gap-1 text-xs">
                        <Shield className="h-3 w-3" /> {t("verified")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{seller.email}</p>
                  {seller.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{seller.bio}</p>}
                  {seller.trust_score && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium">{seller.trust_score}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/seller/${seller.id}`)}>
                    {t("view")}
                  </Button>
                  {canContact && user?.id !== seller.id && (
                    <Button size="sm" onClick={() => navigate(`/seller-chat/${seller.id}`)}>
                      <MessageCircle className="h-4 w-4 mr-1" /> {t("contact")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
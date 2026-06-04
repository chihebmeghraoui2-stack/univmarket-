import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import ServiceCard from "@/components/service-card";
import { useGetWishlist } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function Wishlist() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAuthenticated } = useAuth();
  const { data: wishlist, isLoading } = useGetWishlist({ query: { enabled: isAuthenticated } });

  if (!isAuthenticated) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-muted-foreground">{t("login_favorites")}</p>
      <Link href="/login"><Button className="mt-4">{t("login")}</Button></Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Heart className="h-6 w-6 text-destructive fill-destructive" />{t("wishlist_title")}
        </h1>
        {wishlist && <p className="text-muted-foreground text-sm mt-1">{wishlist.length} {t("saved_services")}</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : !wishlist?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold mb-2">{t("no_favorites")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("no_favorites_desc")}</p>
            <Link href="/search">
              <Button className="gradient-teal text-white border-none">{t("explore_services")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((s: any) => <ServiceCard key={s.id} {...s} />)}
        </div>
      )}
    </div>
  );
}
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Shield, Clock, CheckCircle, Package, MapPin, MessageSquare, ArrowLeft, Award, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SellerProfile() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/seller/:id");
  const [, navigate] = useLocation();

  const { data: seller, isLoading } = useQuery({
    queryKey: ["/api/sellers", params?.id],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/sellers/${params?.id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: servicesRaw } = useQuery({
    queryKey: ["/api/services", { sellerId: params?.id }],
    enabled: !!params?.id,
    queryFn: async () => {
      const res = await fetch(`/api/services?sellerId=${params?.id}&status=approved`);
      return res.json();
    },
  });

  const services = Array.isArray(servicesRaw) ? servicesRaw : servicesRaw?.data ?? [];
  const trustScore = parseFloat(seller?.profile?.trustScore || seller?.trust_score || "0");
  const completionRate = seller?.profile?.completionRate || seller?.completion_rate || 0;
  const totalOrders = seller?.profile?.totalOrders || seller?.total_orders || 0;
  const responseTime = seller?.profile?.responseTime || 0;
  const skills = seller?.profile?.skills || [];
  const bio = seller?.profile?.bio || seller?.bio || "";
  const name = seller?.name || seller?.fullName || seller?.username || "Vendeur";
  const avatar = seller?.avatar || null;
  const isVerified = seller?.profile?.isVerified || !!seller?.verified_at || !!seller?.verifiedAt;

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );

  if (!seller) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Package className="h-16 w-16 text-muted-foreground/30" />
      <p className="text-muted-foreground font-medium">{t("seller_not_found")}</p>
      <Button variant="outline" onClick={() => navigate("/")} className="gap-2 rounded-xl">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
    </div>
  );

  const trustColor = trustScore >= 80 ? "text-green-600" : trustScore >= 60 ? "text-amber-600" : "text-red-500";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Banner */}
        <div style={{ height: 100, background: "linear-gradient(135deg, #0a4f3f, #1D9E75)" }} />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end -mt-12 mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={avatar ?? undefined} />
                <AvatarFallback className="text-3xl font-bold" style={{ background: "linear-gradient(135deg,#0F6E56,#1D9E75)", color: "white" }}>
                  {name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              )}
            </div>
            <div className="flex-1 sm:mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                {isVerified && (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-xs">
                    <Shield className="h-3 w-3" /> Vérifié
                  </Badge>
                )}
              </div>
              {bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-lg">{bio}</p>}
            </div>
            <Button
              className="rounded-xl gap-2 text-white border-none flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0F6E56,#1D9E75)" }}
              onClick={() => navigate(`/chat?userId=${params?.id}`)}>
              <MessageSquare className="h-4 w-4" /> Contacter
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              <p className={`text-xl font-bold ${trustColor}`}>{trustScore.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Trust Score</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Complétion</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{responseTime} min</p>
              <p className="text-xs text-muted-foreground">Réponse</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-teal-600" /> Compétences
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <span key={skill} className="bg-teal-50 text-teal-700 border border-teal-100 text-xs px-3 py-1 rounded-full font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-600" /> Services ({services.length})
        </h2>
        {!services.length ? (
          <div className="text-center py-10">
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun service disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((svc: any) => (
              <div key={svc.id}
                className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/services/${svc.id}`)}>
                {(svc.images?.[0] || svc.image) && (
                  <img src={svc.images?.[0] || svc.image} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm line-clamp-2 text-gray-900">{svc.title_fr || svc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{svc.description_fr || svc.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm text-teal-700">
                      {svc.price_type === "negotiable" ? "Négociable" : `${svc.price?.toLocaleString()} DZD`}
                    </span>
                    <span className="text-xs text-muted-foreground">{svc.delivery_days}j livraison</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

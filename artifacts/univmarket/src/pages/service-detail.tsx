import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, CheckCircle, MapPin, Clock, Heart, HeartOff, MessageCircle, Shield, Award, AlertTriangle, Loader2, Sparkles, Navigation } from "lucide-react";
import { useGetService, useListReviews, useCreateOrder, useAddToWishlist, useRemoveFromWishlist, useGetWishlist, useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function ServiceDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/services/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [orderOpen, setOrderOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [orderNotes, setOrderNotes] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [comment, setComment] = useState("");
  const [aiRating, setAiRating] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const analyzeComment = async () => {
    if (comment.trim().length < 5) return;
    setAiLoading(true); setAiRating(null); setBlocked(false);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/moderate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!data.approved) {
        setBlocked(true);
        setBlockReason(data.reason || t("inappropriate_content"));
        toast({ title: t("comment_blocked"), description: data.reason, variant: "destructive" });
      } else {
        setAiRating(data.rating);
      }
    } catch { setAiRating(3); } finally { setAiLoading(false); }
  };

  const { data: service, isLoading } = useGetService(id, { query: { enabled: !!id } });
  const { data: reviews } = useListReviews({ service_id: id, page: 1, limit: 10 }, { query: { enabled: !!id } });
  const { data: wishlist } = useGetWishlist({ query: { enabled: isAuthenticated } });
  const createOrder = useCreateOrder();
  const { data: orders } = useListOrders({ limit: 50 });
  const addWishlist = useAddToWishlist();
  const removeWishlist = useRemoveFromWishlist();

  const isWishlisted = wishlist?.some((w: any) => w.id === id);

  const contactMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/product-chats/service/${id}/contact`, { method: "POST" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("unauthorized");
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || t("chat_init_error"));
      }
      return res.json();
    },
    onSuccess: (data: any) => setLocation(`/product-chat/${data.chatId}`),
    onError: (error: any) => {
      if (String(error.message).includes("unauthorized")) { setLocation("/login"); return; }
      toast({ title: t("order_error"), description: String(error.message), variant: "destructive" });
    },
  });

  const handleContact = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    contactMutation.mutate();
  };

  const handleConfirmOrder = () => {
    createOrder.mutate(
      { data: { service_id: id, payment_method: paymentMethod as any, notes: orderNotes } },
      {
        onSuccess: (order: any) => {
          setOrderOpen(false);
          toast({ title: t("order_success"), description: t("order_success_desc") });
          setLocation(`/orders/${order.id}`);
        },
        onError: () => toast({ title: t("order_error"), description: t("order_error_desc"), variant: "destructive" }),
      }
    );
  };

  const handleWishlist = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    if (isWishlisted) {
      removeWishlist.mutate({ serviceId: id }, { onSuccess: () => toast({ title: t("removed_wishlist") }) });
    } else {
      addWishlist.mutate({ serviceId: id }, { onSuccess: () => toast({ title: t("added_wishlist") }) });
    }
  };

  const getTrustLabel = (score: number) => {
    if (score >= 85) return t("excellence_seller");
    if (score >= 70) return t("reliable_seller");
    if (score >= 50) return t("active_seller");
    return t("new_seller");
  };

  const startChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/product-chats/service/${params?.id}/contact`, { method: "POST" });
      if (!res.ok) throw new Error(t("chat_init_error"));
      return res.json();
    },
    onSuccess: (data: any) => navigate(`/product-chat/${data.chatId}`),
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!service) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">{t("service_not_found")}</h2>
      <Button onClick={() => setLocation("/")}>{t("back_home")}</Button>
    </div>
  );

  const imgs = service.images?.length ? service.images : ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop&auto=format"];
  const priceLabel = service.price_type === "negotiable" ? t("negotiable") : `${service.price?.toLocaleString()} DZD`;
  const trustScore = service.seller_trust_score;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="space-y-2">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={imgs[imgIdx]} alt={service.title_fr} className="w-full h-full object-cover" />
            </div>
            {imgs.length > 1 && (
              <div className="flex gap-2">
                {imgs.map((img: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {service.category_name_fr && <Badge variant="secondary">{service.category_name_fr}</Badge>}
              {service.wilaya_name_fr && <Badge variant="outline" className="flex items-center gap-1"><MapPin className="h-3 w-3" />{service.wilaya_name_fr}</Badge>}
              {service.seller_verified && <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{t("verified_seller")}</Badge>}
            </div>
            <h1 className="text-2xl font-extrabold">{service.title_fr}</h1>
            {service.avg_rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(service.avg_rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="font-semibold text-sm">{service.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({service.reviews_count} {t("reviews")})</span>
              </div>
            )}
          </div>

          {/* Description */}
          {service.description_fr && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("service_desc")}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{service.description_fr}</p>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          {service.location_lat && service.location_lng && (
            <Card className="border-teal-200 bg-teal-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-teal-800">
                  <MapPin className="h-4 w-4 text-teal-600" />{t("event_location")}
                </CardTitle>
                {service.location_address && (
                  <p className="text-sm text-teal-700 flex items-center gap-1.5 mt-1">
                    <Navigation className="h-3.5 w-3.5" />{service.location_address}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="rounded-xl overflow-hidden border border-teal-200 shadow-sm">
                  <iframe title={t("event_location")} width="100%" height="300" style={{ border: 0 }} loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${service.location_lng - 0.005},${service.location_lat - 0.005},${service.location_lng + 0.005},${service.location_lat + 0.005}&layer=mapnik&marker=${service.location_lat},${service.location_lng}`} />
                </div>
                <a href={`https://www.openstreetmap.org/?mlat=${service.location_lat}&mlon=${service.location_lng}#map=17/${service.location_lat}/${service.location_lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-teal-700 font-medium bg-teal-100 hover:bg-teal-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Navigation className="h-3.5 w-3.5" />{t("open_in_osm")}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Reviews list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />{t("reviews")} ({reviews?.total ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!reviews?.data?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("no_reviews")}</p>
              ) : reviews.data.map((r: any) => (
                <div key={r.id} className="space-y-2 pb-4 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={r.client_avatar ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">{r.client_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{r.client_name}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                  {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                  {r.seller_reply && (
                    <div className="ml-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-xs font-medium text-primary mb-1">{t("seller_reply")}</p>
                      <p className="text-xs text-muted-foreground">{r.seller_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Leave review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />{t("leave_review")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submitted ? (
                <div className="text-center py-6 text-teal-700 font-medium">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-teal-600" />{t("review_thanks")}
                </div>
              ) : (<>
                <Textarea value={comment} onChange={e => { setComment(e.target.value); setAiRating(null); }}
                  placeholder={t("review_placeholder")} rows={4} className="resize-none text-sm" />
                {blocked && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <div>
                      <p className="text-sm text-red-700 font-medium">{t("comment_blocked")}</p>
                      <p className="text-xs text-red-500">{blockReason}</p>
                    </div>
                  </div>
                )}
                {aiRating && (
                  <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span className="text-sm text-teal-700 font-medium">{t("ai_rating")}:</span>
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={"h-4 w-4 " + (i < aiRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    ))}</div>
                    <span className="text-sm font-bold text-amber-600">{aiRating}/5</span>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={analyzeComment} disabled={aiLoading || comment.trim().length < 5}
                    className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {aiLoading ? t("analyzing") : t("analyze_with_ai")}
                  </Button>
                  <Button onClick={async () => {
                    if (!aiRating) return;
                    try {
                      const completedOrder = orders?.data?.find((o: any) => o.service_id === id && o.status === "completed");
                      if (!completedOrder) { toast({ title: t("need_completed_order"), variant: "destructive" }); return; }
                      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/reviews", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + localStorage.getItem("token") },
                        body: JSON.stringify({ order_id: completedOrder.id, rating: aiRating, body: comment }),
                      });
                      if (res.ok) { setSubmitted(true); }
                      else { const err = await res.json(); toast({ title: err.error || t("order_error"), variant: "destructive" }); }
                    } catch { toast({ title: t("connection_error"), variant: "destructive" }); }
                  }} disabled={!aiRating} className="bg-teal-700 hover:bg-teal-600 text-white">
                    {t("publish_review")}
                  </Button>
                </div>
              </>)}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT - Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24 border-2 shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-3xl font-extrabold text-primary">{priceLabel}</p>
                {service.price_type === "hourly" && <span className="text-xs text-muted-foreground">{t("per_hour")}</span>}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />{t("delivery_days")}</span>
                  <span className="font-medium">{service.delivery_days} {t("day")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Shield className="h-4 w-4" />{t("payment")}</span>
                  <span className="font-medium text-emerald-600">{t("secure_escrow")}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={service.seller_avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">{service.seller_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{service.seller_name}</span>
                    {service.seller_verified && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                  {trustScore && <p className="text-xs font-medium"><Award className="h-3 w-3 inline mr-1" />{getTrustLabel(trustScore)}</p>}
                </div>
              </div>
              <Button className="w-full h-11 gradient-teal text-white border-none font-semibold"
                onClick={handleContact} disabled={contactMutation.isPending}>
                <MessageCircle className="h-4 w-4 mr-2" />{t("start_discussion")}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleWishlist}>
                {isWishlisted
                  ? <><HeartOff className="h-4 w-4 mr-2 text-destructive" />{t("remove_wishlist")}</>
                  : <><Heart className="h-4 w-4 mr-2" />{t("add_wishlist")}</>}
              </Button>
              <p className="text-xs text-muted-foreground text-center">{t("money_secured")}</p>
              {service.location_lat && service.location_lng && (
                <Button variant="outline" className="w-full border-teal-300 text-teal-700 hover:bg-teal-50 gap-2" onClick={() => setMapOpen(true)}>
                  <MapPin className="h-4 w-4" />{t("view_event_location")}
                </Button>
              )}
              <Button className="w-full gradient-teal text-white border-none font-semibold" onClick={() => setOrderOpen(true)}>
                {t("order_now")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Map */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 py-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-teal-800">
              <MapPin className="h-5 w-5 text-teal-600" />{t("event_location")}
            </DialogTitle>
            {service?.location_address && (
              <p className="text-sm text-teal-600 flex items-center gap-1.5 mt-1">
                <Navigation className="h-3.5 w-3.5" />{service.location_address}
              </p>
            )}
          </DialogHeader>
          <div className="w-full h-[400px]">
            {service?.location_lat && service?.location_lng && (
              <iframe title={t("event_location")} width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${service.location_lng - 0.008},${service.location_lat - 0.008},${service.location_lng + 0.008},${service.location_lat + 0.008}&layer=mapnik&marker=${service.location_lat},${service.location_lng}`} />
            )}
          </div>
          <div className="px-5 py-3 border-t flex justify-between items-center">
            <a href={`https://www.openstreetmap.org/?mlat=${service?.location_lat}&mlon=${service?.location_lng}#map=17/${service?.location_lat}/${service?.location_lng}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-teal-700 font-medium hover:text-teal-900">
              <Navigation className="h-4 w-4" />{t("open_in_osm")}
            </a>
            <Button variant="outline" onClick={() => setMapOpen(false)} className="rounded-xl h-9 px-4 text-sm">{t("close")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Order */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("confirm_order")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-sm">{service.title_fr}</p>
              <p className="text-2xl font-extrabold text-primary mt-1">{priceLabel}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("payment_method")}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cib">CIB</SelectItem>
                  <SelectItem value="baridimob">BaridiMob</SelectItem>
                  <SelectItem value="dahabia">Dahabia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("notes_seller")}</Label>
              <Textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder={t("notes_placeholder")} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleConfirmOrder} disabled={createOrder.isPending} className="gradient-teal text-white border-none">
              {createOrder.isPending ? t("in_progress") : t("confirm_order")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

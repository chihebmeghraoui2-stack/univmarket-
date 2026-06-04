import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertTriangle, XCircle, ArrowLeft, ShoppingBag, Star, Shield } from "lucide-react";
import { useGetOrder, useAcceptOrder, useCancelOrder, useCompleteOrder, useDeliverOrder, useCreateReview, useOpenDispute } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function OrderDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/orders/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const { data: order, isLoading, refetch } = useGetOrder(id, { query: { enabled: !!id } });
  const acceptOrder = useAcceptOrder();
  const cancelOrder = useCancelOrder();
  const completeOrder = useCompleteOrder();
  const deliverOrder = useDeliverOrder();
  const createReview = useCreateReview();
  const openDispute = useOpenDispute();

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: t("status_pending_detail"), color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    accepted: { label: t("status_accepted_detail"), color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
    in_progress: { label: t("status_in_progress_detail"), color: "bg-purple-100 text-purple-700 border-purple-200", icon: Clock },
    delivered: { label: t("status_delivered_detail"), color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
    completed: { label: t("status_completed_detail"), color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    disputed: { label: t("status_disputed_detail"), color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
    cancelled: { label: t("status_cancelled_detail"), color: "bg-gray-100 text-gray-500 border-gray-200", icon: XCircle },
  };

  const handleUpdateStatus = (newStatus: string) => {
    const opts = {
      onSuccess: () => { toast({ title: t("status_updated") }); refetch(); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" as any }),
    };
    if (newStatus === "accepted") acceptOrder.mutate({ orderId: id }, opts);
    else if (newStatus === "delivered") deliverOrder.mutate({ orderId: id }, opts);
    else if (newStatus === "completed") completeOrder.mutate({ orderId: id }, opts);
    else if (newStatus === "cancelled") cancelOrder.mutate({ orderId: id }, opts);
    else if (newStatus === "in_progress") acceptOrder.mutate({ orderId: id }, opts);
  };

  const handleReview = () => {
    createReview.mutate({ data: { order_id: id, rating, body: reviewBody } }, {
      onSuccess: () => { setReviewOpen(false); toast({ title: t("review_published") }); refetch(); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" as any }),
    });
  };

  const handleDispute = () => {
    openDispute.mutate({ data: { order_id: id, reason: disputeReason } }, {
      onSuccess: () => { setDisputeOpen(false); toast({ title: t("dispute_opened") }); refetch(); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" as any }),
    });
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
      <h2 className="font-semibold text-lg mb-2">{t("order_not_found")}</h2>
      <Link href="/orders"><Button>{t("back_orders")}</Button></Link>
    </div>
  );

  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-500", icon: Clock };
  const Icon = cfg.icon;
  const isClient = user?.id === order.client_id;
  const isSellerOfOrder = user?.id === order.seller_id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Link href="/orders"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-xl font-extrabold">{t("order_detail")} #{order.id}</h1>
          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color} border shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Badge className={`${cfg.color} border text-sm font-semibold mb-2`}>{cfg.label}</Badge>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("total_amount")}</p>
                  <p className="font-extrabold text-lg text-primary">{order.total_price.toLocaleString()} DZD</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("platform_commission")}</p>
                  <p className="font-semibold">{order.commission_amount.toLocaleString()} DZD</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("payment_method")}</p>
                  <p className="font-medium capitalize">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("payment_status")}</p>
                  <p className="font-medium capitalize">{order.payment_status}</p>
                </div>
              </div>
            </div>
          </div>
          {order.notes && (
            <div className="mt-4 p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">{t("notes")}</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isSellerOfOrder && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{t("seller_actions")}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {order.status === "pending" && (
              <>
                <Button size="sm" onClick={() => handleUpdateStatus("accepted")} className="gradient-teal text-white border-none">{t("accept")}</Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus("cancelled")} className="text-destructive border-destructive/30">{t("refuse")}</Button>
              </>
            )}
            {order.status === "accepted" && (
              <Button size="sm" onClick={() => handleUpdateStatus("in_progress")} className="gradient-teal text-white border-none">{t("mark_in_progress")}</Button>
            )}
            {order.status === "in_progress" && (
              <Button size="sm" onClick={() => handleUpdateStatus("delivered")} className="gradient-teal text-white border-none">{t("mark_delivered")}</Button>
            )}
          </CardContent>
        </Card>
      )}

      {isClient && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{t("client_actions")}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {order.status === "delivered" && (
              <>
                <Button size="sm" onClick={() => handleUpdateStatus("completed")} className="gradient-teal text-white border-none">
                  <CheckCircle className="h-4 w-4 mr-1.5" />{t("confirm_delivery")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDisputeOpen(true)} className="text-destructive border-destructive/30">
                  <AlertTriangle className="h-4 w-4 mr-1.5" />{t("open_dispute")}
                </Button>
              </>
            )}
            {order.status === "completed" && !order.has_review && (
              <Button size="sm" onClick={() => setReviewOpen(true)} className="gap-1.5">
                <Star className="h-4 w-4" />{t("leave_review")}
              </Button>
            )}
            {(order.status === "pending" || order.status === "accepted") && (
              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus("cancelled")} className="text-destructive border-destructive/30">
                {t("cancel_order")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">{t("escrow_title")}</p>
            <p className="text-xs text-muted-foreground">{t("escrow_desc")}</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("review_title")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("rating")}</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setRating(i + 1)}>
                    <Star className={`h-6 w-6 transition-colors ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("comment")}</Label>
              <Textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder={t("comment_placeholder")} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleReview} disabled={createReview.isPending} className="gradient-teal text-white border-none">
              {createReview.isPending ? t("publishing") : t("publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("dispute_title")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t("dispute_desc")}</p>
            <div className="space-y-2">
              <Label>{t("dispute_reason")}</Label>
              <Textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder={t("dispute_placeholder")} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleDispute} disabled={openDispute.isPending} variant="destructive">
              {openDispute.isPending ? t("in_progress_btn") : t("open_dispute_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
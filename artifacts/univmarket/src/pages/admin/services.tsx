import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAdminListPendingServices, useAdminApproveService, useAdminRejectService } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminServices() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { toast } = useToast();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [page, setPage] = useState(1);

  const { data: services, isLoading, refetch } = useAdminListPendingServices({ page, limit: 20 });
  const approveService = useAdminApproveService();
  const rejectService = useAdminRejectService();

  const handleApprove = (id: number) => {
    approveService.mutate({ id }, {
      onSuccess: () => { refetch(); toast({ title: t("service_approved") }); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" }),
    });
  };

  const handleReject = () => {
    if (!rejectId) return;
    rejectService.mutate({ id: rejectId, data: { reason: rejectReason } }, {
      onSuccess: () => { setRejectId(null); setRejectReason(""); refetch(); toast({ title: t("service_rejected") }); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("pending_services_title")}</h1>
              <p className="text-xs text-muted-foreground">Validation des services soumis par les vendeurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{services?.total ?? 0} {t("pending")}</span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : !services?.data?.length ? (
        <div className="py-16 text-center">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
          <p className="font-semibold">{t("no_pending_services")}</p>
        </div>
        ) : (
          <div className="space-y-3">
            {services.data.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{s.title_fr}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description_fr?.slice(0, 120)}...</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs rounded-full">{s.category_name_fr}</Badge>
                      <Badge variant="outline" className="text-xs rounded-full">{s.wilaya_name_fr}</Badge>
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{s.price?.toLocaleString()} DZD</span>
                      <span className="text-xs text-muted-foreground">{t("by_seller")} <span className="font-medium text-gray-700">{s.seller_name}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(s.id)}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 text-xs"
                      disabled={approveService.isPending}>
                      <CheckCircle className="h-3.5 w-3.5" />{t("approve")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectId(s.id)}
                      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-8 px-3 text-xs">
                      <XCircle className="h-3.5 w-3.5" />{t("reject_btn")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {services && services.total > 20 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl">{t("previous")}</Button>
            <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(services.total / 20)} className="rounded-xl">{t("next")}</Button>
          </div>
        )}

      </div>

      {/* Dialog Reject */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"} className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              {t("reject_service_title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>{t("reject_reason")}</Label>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t("reject_reason_placeholder")}
              rows={3}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)} className="rounded-xl">{t("cancel")}</Button>
            <Button onClick={handleReject} disabled={!rejectReason || rejectService.isPending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              {t("reject_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

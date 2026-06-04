import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useListDisputes, useAdminResolveDispute } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminDisputes() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [decision, setDecision] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const { data: disputes, isLoading, refetch } = useListDisputes({ page, limit: 20 });
  const resolveDispute = useAdminResolveDispute();

  const handleResolve = () => {
    if (!resolveId || !decision) return;
    resolveDispute.mutate(
      { disputeId: resolveId, data: { decision, refund_amount: refundAmount ? Number(refundAmount) : undefined } },
      {
        onSuccess: () => { setResolveId(null); refetch(); toast({ title: t("dispute_resolved") }); },
        onError: () => toast({ title: t("order_error"), variant: "destructive" }),
      }
    );
  };

  const STATUS_COLOR: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    seller_replied: "bg-amber-100 text-amber-700",
    admin_review: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
  };

  const STATUS_LABEL: Record<string, string> = {
    open: t("dispute_open"), seller_replied: t("dispute_seller_replied"),
    admin_review: t("dispute_admin_review"), resolved: t("dispute_resolved_status"),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive" />{t("disputes")}</h1>
        <p className="text-muted-foreground text-sm">{disputes?.total ?? 0} {t("disputes")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !disputes?.data?.length ? (
        <Card><CardContent className="py-16 text-center">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
          <p className="font-semibold">{t("no_disputes")}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {disputes.data.map((d: any) => (
            <Card key={d.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="font-semibold text-sm">{t("dispute_title")} #{d.id} - {t("order_title")} #{d.order_id}</p>
                      <Badge className={`text-xs border-none ${STATUS_COLOR[d.status] ?? "bg-gray-100"}`}>
                        {STATUS_LABEL[d.status] ?? d.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{d.reason?.slice(0, 120)}...</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  {d.status !== "resolved" && (
                    <Button size="sm" onClick={() => setResolveId(d.id)} className="gradient-teal text-white border-none shrink-0">
                      {t("resolve")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {disputes && disputes.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(disputes.total / 20)}>{t("next")}</Button>
        </div>
      )}

      <Dialog open={!!resolveId} onOpenChange={() => setResolveId(null)}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("resolve_dispute")} #{resolveId}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("decision")}</Label>
              <Textarea value={decision} onChange={e => setDecision(e.target.value)} placeholder={t("decision_placeholder")} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("refund_amount")}</Label>
              <Input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveId(null)}>{t("cancel")}</Button>
            <Button onClick={handleResolve} disabled={!decision || resolveDispute.isPending} className="gradient-teal text-white border-none">
              {t("resolve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
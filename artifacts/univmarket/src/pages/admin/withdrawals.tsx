import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CheckCircle } from "lucide-react";
import { useAdminListWithdrawals, useAdminProcessWithdrawal } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminWithdrawals() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [processId, setProcessId] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<"approved" | "rejected">("approved");
  const [adminNote, setAdminNote] = useState("");

  const { data: withdrawals, isLoading, refetch } = useAdminListWithdrawals({ page, limit: 20 });
  const processWithdrawal = useAdminProcessWithdrawal();

  const STATUS_COLOR: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    processed: "bg-green-100 text-green-700",
  };

  const STATUS_LABEL: Record<string, string> = {
    pending: t("pending"), approved: t("approved"),
    rejected: t("rejected"), processed: t("processed"),
  };

  const handleProcess = () => {
    if (!processId) return;
    processWithdrawal.mutate(
      { withdrawalId: processId, data: { status: actionStatus, admin_note: adminNote } },
      {
        onSuccess: () => {
          setProcessId(null); setAdminNote(""); refetch();
          toast({ title: actionStatus === "approved" ? t("withdrawal_approved") : t("withdrawal_rejected") });
        },
        onError: () => toast({ title: t("order_error"), variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />{t("withdrawal_requests")}
        </h1>
        <p className="text-muted-foreground text-sm">{withdrawals?.total ?? 0} {t("requests")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !withdrawals?.data?.length ? (
        <Card><CardContent className="py-16 text-center">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
          <p className="font-semibold">{t("no_pending_withdrawals")}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {withdrawals.data.map((w: any) => (
            <Card key={w.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{t("withdrawal")} #{w.id}</p>
                      <Badge className={`text-xs border-none ${STATUS_COLOR[w.status] ?? "bg-gray-100"}`}>
                        {STATUS_LABEL[w.status] ?? w.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.seller_name} · {w.method} · {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xl font-extrabold text-primary shrink-0">{w.amount.toLocaleString()} DZD</p>
                  {w.status === "pending" && (
                    <Button size="sm" onClick={() => setProcessId(w.id)} className="gradient-teal text-white border-none shrink-0">
                      {t("process")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {withdrawals && withdrawals.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(withdrawals.total / 20)}>{t("next")}</Button>
        </div>
      )}

      <Dialog open={!!processId} onOpenChange={() => setProcessId(null)}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("process_withdrawal")} #{processId}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("decision")}</Label>
              <Select value={actionStatus} onValueChange={v => setActionStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">{t("approve")}</SelectItem>
                  <SelectItem value="rejected">{t("reject_btn")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin_note")}</Label>
              <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder={t("admin_note_placeholder")} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessId(null)}>{t("cancel")}</Button>
            <Button onClick={handleProcess} disabled={processWithdrawal.isPending} className="gradient-teal text-white border-none">
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
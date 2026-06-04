import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, CheckCircle, XCircle, Clock, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

export default function AdminTrendingRequests() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-trending-requests", filter],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/trending-requests?status=${filter}`);
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, act, note }: { id: number; act: string; note: string }) => {
      const res = await apiFetch(`/api/admin/trending-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({ action: act, admin_note: note }),
      });
      if (!res.ok) throw new Error(t("order_error"));
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.act === "approve" ? t("trending_approved") : t("trending_rejected") });
      setSelected(null); setAdminNote(""); setAction(null);
      queryClient.invalidateQueries({ queryKey: ["admin-trending-requests"] });
    },
    onError: () => toast({ title: t("order_error"), variant: "destructive" }),
  });

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: t("pending"), color: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: t("status_accepted"), color: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: t("status_rejected"), color: "bg-red-100 text-red-700", icon: XCircle },
  };

  const filterLabels: Record<string, string> = {
    pending: t("pending"), approved: t("status_accepted"),
    rejected: t("status_rejected"), all: t("see_all"),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("trending_requests_title")}</h1>
          <p className="text-xs text-muted-foreground">{t("trending_requests_desc")}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : !requests?.length ? (
        <div className="py-16 text-center">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-gray-600">{t("no_trending_requests")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const cfg = statusConfig[req.status] ?? statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {req.images?.[0] ? (
                    <img src={req.images[0]} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Star className="h-7 w-7 text-purple-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{req.title_fr}</p>
                        <p className="text-xs text-muted-foreground">{req.price?.toLocaleString()} DZD</p>
                      </div>
                      <Badge className={`text-xs border-0 flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />{cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {req.seller_avatar && <img src={req.seller_avatar} className="w-5 h-5 rounded-full object-cover" />}
                      <span className="text-xs text-gray-600 font-medium">{req.seller_name}</span>
                      <span className="text-xs text-muted-foreground">· {req.seller_email}</span>
                    </div>
                    {req.message && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 italic">"{req.message}"</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <Button size="sm" className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                      onClick={() => { setSelected(req); setAction("approve"); }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> {t("approve")}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                      onClick={() => { setSelected(req); setAction("reject"); }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> {t("reject")}
                    </Button>
                  </div>
                )}
                {req.status === "approved" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs px-4"
                      onClick={() => { setSelected(req); setAction("reject"); }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> {t("remove_from_trending")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected && !!action} onOpenChange={() => { setSelected(null); setAction(null); setAdminNote(""); }}>
        <DialogContent className="rounded-2xl max-w-sm" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${action === "approve" ? "text-green-700" : "text-red-700"}`}>
              {action === "approve" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {action === "approve" ? t("accept_request") : t("reject_request")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selected && (
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                {selected.images?.[0] && <img src={selected.images[0]} className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="text-sm font-medium">{selected.title_fr}</p>
                  <p className="text-xs text-muted-foreground">{selected.seller_name}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">
                {t("note_for_seller")} {action === "reject" ? t("required") : t("optional")} :
              </p>
              <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder={action === "approve" ? t("congrats_placeholder") : t("rejection_reason_placeholder")}
                rows={3} className="rounded-xl resize-none text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); setAdminNote(""); }} className="rounded-xl">{t("cancel")}</Button>
            <Button disabled={decideMutation.isPending || (action === "reject" && !adminNote.trim())}
              onClick={() => selected && action && decideMutation.mutate({ id: selected.id, act: action, note: adminNote })}
              className={`rounded-xl text-white border-none ${action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
              {decideMutation.isPending ? "..." : action === "approve" ? t("confirm_btn") : t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
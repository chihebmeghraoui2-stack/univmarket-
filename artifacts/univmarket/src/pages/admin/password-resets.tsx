import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";

const H = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

export default function AdminPasswordResets() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-password-resets"],
    queryFn: async () => {
      const r = await fetch((import.meta.env.VITE_API_URL || "") + "/api/admin/password-reset-requests", { headers: H() });
      const json = await r.json();
      return json.data ?? [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/password-reset-requests/${selectedId}/approve`, {
        method: "PUT", headers: H(), body: JSON.stringify({ newPassword }),
      });
      if (!r.ok) throw new Error(t("order_error"));
    },
    onSuccess: () => {
      toast({ title: t("request_approved") });
      qc.invalidateQueries({ queryKey: ["admin-password-resets"] });
      setOpen(false); setNewPassword("");
    },
    onError: () => toast({ title: t("order_error"), variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/password-reset-requests/${id}/reject`, {
        method: "PUT", headers: H(),
      });
      if (!r.ok) throw new Error(t("order_error"));
    },
    onSuccess: () => {
      toast({ title: t("request_rejected") });
      qc.invalidateQueries({ queryKey: ["admin-password-resets"] });
    },
    onError: () => toast({ title: t("order_error"), variant: "destructive" }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <KeyRound className="h-6 w-6" /> {t("password_resets_title")}
      </h1>
      <Card>
        <CardHeader><CardTitle>{t("pending_requests")} ({data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">{t("loading")}</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("seller_label")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("date_col")}</TableHead>
                  <TableHead>{t("status_col")}</TableHead>
                  <TableHead>{t("actions_col")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.length && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("no_pending_requests")}</TableCell></TableRow>
                )}
                {data?.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.seller_name || t("unknown")}</TableCell>
                    <TableCell>{req.email}</TableCell>
                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="secondary">{req.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setSelectedId(req.id); setOpen(true); }} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t("approve")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(req.id)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-4 w-4 mr-1" /> {t("reject")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("set_new_password")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{t("seller_will_receive_email")}</p>
            <Input type="password" placeholder={t("new_password_placeholder")} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => approveMutation.mutate()} disabled={!newPassword || newPassword.length < 6 || approveMutation.isPending}>
              {approveMutation.isPending ? t("sending") : t("approve_and_send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

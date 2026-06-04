import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ToggleLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function SellerCouponsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState(0);
  const [limit, setLimit] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading, refetch } = useQuery(["seller-coupons"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/coupons", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ code, type, value, usage_limit: limit, expires_at: expiresAt }),
      });
      if (!res.ok) throw new Error(t("creation_failed"));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("coupon_created") });
      setOpen(false); setCode(""); setValue(0); setLimit(1); setExpiresAt("");
      refetch();
    },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (coupon: any) => {
      const res = await fetch(`/api/coupons/${coupon.id}/toggle`, {
        method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("toggle_failed"));
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("delete_failed"));
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const couponRows = useMemo(() => data ?? [], [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("coupons_title")}</h1>
          <p className="text-muted-foreground">{t("coupons_desc")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />{t("create_coupon")}</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /></div>
          ) : !couponRows.length ? (
            <div className="py-16 text-center text-muted-foreground">{t("no_coupons")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-3 px-4 text-left">{t("coupon_code")}</th>
                    <th className="py-3 px-4 text-left">{t("coupon_type")}</th>
                    <th className="py-3 px-4 text-left">{t("coupon_value")}</th>
                    <th className="py-3 px-4 text-left">{t("coupon_usage")}</th>
                    <th className="py-3 px-4 text-left">{t("coupon_expiry")}</th>
                    <th className="py-3 px-4 text-left">{t("status_col")}</th>
                    <th className="py-3 px-4 text-left">{t("actions_col")}</th>
                  </tr>
                </thead>
                <tbody>
                  {couponRows.map((coupon: any) => (
                    <tr key={coupon.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">{coupon.code}</td>
                      <td className="py-3 px-4 capitalize">{coupon.type}</td>
                      <td className="py-3 px-4">{coupon.type === "percentage" ? `${coupon.value}%` : `${coupon.value.toLocaleString()} DZD`}</td>
                      <td className="py-3 px-4">{coupon.usage_count} / {coupon.usage_limit}</td>
                      <td className="py-3 px-4">{new Date(coupon.expires_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={coupon.active ? "secondary" : "outline"}>
                          {coupon.active ? t("active") : t("inactive")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(coupon)}>
                          <ToggleLeft className="h-4 w-4 mr-1" />
                          {coupon.active ? t("deactivate") : t("activate")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(coupon.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("create_coupon")}</DialogTitle>
            <DialogDescription>{t("create_coupon_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("coupon_code")}</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="EXEMPLE10" />
            </div>
            <div>
              <Label>{t("coupon_type")}</Label>
              <Select value={type} onValueChange={v => setType(v as any)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t("percentage")}</SelectItem>
                  <SelectItem value="fixed">{t("fixed_amount")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("coupon_value")}</Label>
              <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("usage_limit")}</Label>
              <Input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("coupon_expiry")}</Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !code || value <= 0 || !expiresAt}>
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

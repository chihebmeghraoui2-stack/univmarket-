import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function AdminCommissionsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState(0);
  const [overrideWilaya, setOverrideWilaya] = useState("Alger");
  const [overrideCategory, setOverrideCategory] = useState<number | null>(null);
  const [overrideRate, setOverrideRate] = useState(0);

  const { data: categories, isLoading: categoriesLoading, refetch } = useQuery({
    queryKey: ["commissions-categories"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/commissions", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["commissions-history"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/commissions/history", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const modifyCategory = useMutation({
    mutationFn: async () => {
      if (!selectedCategoryId) throw new Error(t("no_category_selected"));
      const res = await fetch(`/api/commissions/${selectedCategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ rate: newRate }),
      });
      if (!res.ok) throw new Error(t("update_failed"));
      return res.json();
    },
    onSuccess: () => { toast({ title: t("commission_updated") }); refetch(); },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const overrideMutation = useMutation({
    mutationFn: async () => {
      if (!overrideCategory) throw new Error(t("no_category_selected"));
      const res = await fetch(`/api/commissions/${overrideCategory}/override`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ wilaya: overrideWilaya, rate: overrideRate }),
      });
      if (!res.ok) throw new Error(t("override_failed"));
      return res.json();
    },
    onSuccess: () => { toast({ title: t("override_created") }); refetch(); },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const categoriesList = useMemo(() => categories ?? [], [categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold">{t("commissions_title")}</h1>
        <p className="text-muted-foreground">{t("commissions_desc")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("commission_by_category")}</CardTitle></CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-3"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /></div>
          ) : (
            <div className="space-y-4">
              {categoriesList.map((category: any) => (
                <div key={category.id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{category.category}</p>
                    <p className="text-sm text-muted-foreground">{t("current_rate")}: {category.rate}%</p>
                  </div>
                  <Button onClick={() => { setSelectedCategoryId(category.id); setNewRate(category.rate); setOpen(true); }}>{t("edit")}</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("override_by_wilaya")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>{t("wilaya")}</Label>
              <Input value={overrideWilaya} onChange={e => setOverrideWilaya(e.target.value)} placeholder="Alger" />
            </div>
            <div>
              <Label>{t("category")}</Label>
              <Select value={overrideCategory?.toString() ?? ""} onValueChange={v => setOverrideCategory(Number(v))}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("choose")} /></SelectTrigger>
                <SelectContent>
                  {categoriesList.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.category}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("percentage")}</Label>
              <Input type="number" value={overrideRate} onChange={e => setOverrideRate(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={() => overrideMutation.mutate()} disabled={overrideMutation.isPending || !overrideCategory}>
            {t("apply_override")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("modification_history")}</CardTitle></CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : !history?.length ? (
            <div className="py-16 text-center text-muted-foreground">{t("no_history")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-3 px-4 text-left">{t("category")}</th>
                    <th className="py-3 px-4 text-left">{t("wilaya")}</th>
                    <th className="py-3 px-4 text-left">{t("old_rate")}</th>
                    <th className="py-3 px-4 text-left">{t("new_rate")}</th>
                    <th className="py-3 px-4 text-left">{t("date_col")}</th>
                    <th className="py-3 px-4 text-left">{t("modified_by")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">{item.category}</td>
                      <td className="py-3 px-4">{item.wilaya ?? t("global")}</td>
                      <td className="py-3 px-4">{item.old_rate}%</td>
                      <td className="py-3 px-4">{item.new_rate}%</td>
                      <td className="py-3 px-4">{new Date(item.changed_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{item.changed_by}</td>
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
            <DialogTitle>{t("edit_commission")}</DialogTitle>
            <DialogDescription>{t("edit_commission_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("percentage")}</Label>
              <Input type="number" value={newRate} onChange={e => setNewRate(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => modifyCategory.mutate()} disabled={modifyCategory.isPending || !selectedCategoryId}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

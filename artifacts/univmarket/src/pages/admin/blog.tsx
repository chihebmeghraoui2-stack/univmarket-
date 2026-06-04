import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export default function AdminBlogPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [articleData, setArticleData] = useState({
    title_fr: "", title_ar: "", content_fr: "", content_ar: "",
    image_url: "", wilaya: t("all_wilayas"), tags: "", status: "draft"
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/blog", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...articleData, tags: articleData.tags.split(",").map(tag => tag.trim()).filter(Boolean) };
      const url = editing ? `/api/blog/${editing.id}` : "/api/blog";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t("save_failed"));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: editing ? t("article_updated") : t("article_created") });
      setOpen(false); setEditing(null);
      setArticleData({ title_fr: "", title_ar: "", content_fr: "", content_ar: "", image_url: "", wilaya: t("all_wilayas"), tags: "", status: "draft" });
      refetch();
    },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/blog/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(t("delete_failed"));
      return res.json();
    },
    onSuccess: () => { refetch(); toast({ title: t("article_deleted") }); },
  });

  const articles = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (editing) {
      setArticleData({
        title_fr: editing.title_fr, title_ar: editing.title_ar,
        content_fr: editing.content_fr, content_ar: editing.content_ar,
        image_url: editing.image_url, wilaya: editing.wilaya,
        tags: editing.tags?.join(", ") ?? "", status: editing.status,
      });
    }
  }, [editing]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin_blog_title")}</h1>
          <p className="text-muted-foreground">{t("admin_blog_desc")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />{t("create_article")}</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /></div>
          ) : !articles.length ? (
            <div className="py-16 text-center text-muted-foreground">{t("no_articles")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-3 px-4 text-left">{t("title_fr")}</th>
                    <th className="py-3 px-4 text-left">{t("status_col")}</th>
                    <th className="py-3 px-4 text-left">{t("wilaya")}</th>
                    <th className="py-3 px-4 text-left">{t("date_col")}</th>
                    <th className="py-3 px-4 text-left">{t("actions_col")}</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article: any) => (
                    <tr key={article.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">{article.title_fr}</td>
                      <td className="py-3 px-4">
                        <Badge variant={article.status === "published" ? "secondary" : "outline"}>
                          {article.status === "published" ? t("published") : t("draft")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{article.wilaya}</td>
                      <td className="py-3 px-4">{article.published_at ? new Date(article.published_at).toLocaleDateString() : "-"}</td>
                      <td className="py-3 px-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => { setEditing(article); setOpen(true); }}>{t("edit")}</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(article.id)}>{t("delete")}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit_article") : t("create_article")}</DialogTitle>
            <DialogDescription>{t("article_dialog_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>{t("title_fr")}</Label><Input value={articleData.title_fr} onChange={e => setArticleData(p => ({ ...p, title_fr: e.target.value }))} /></div>
            <div><Label>{t("title_ar")}</Label><Input value={articleData.title_ar} onChange={e => setArticleData(p => ({ ...p, title_ar: e.target.value }))} dir="rtl" /></div>
            <div><Label>{t("content_fr")}</Label><Textarea value={articleData.content_fr} onChange={e => setArticleData(p => ({ ...p, content_fr: e.target.value }))} rows={4} /></div>
            <div><Label>{t("content_ar")}</Label><Textarea value={articleData.content_ar} onChange={e => setArticleData(p => ({ ...p, content_ar: e.target.value }))} rows={4} dir="rtl" /></div>
            <div><Label>{t("cover_image")}</Label><Input value={articleData.image_url} onChange={e => setArticleData(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." /></div>
            <div><Label>{t("wilaya")}</Label><Input value={articleData.wilaya} onChange={e => setArticleData(p => ({ ...p, wilaya: e.target.value }))} /></div>
            <div><Label>{t("tags_label")}</Label><Input value={articleData.tags} onChange={e => setArticleData(p => ({ ...p, tags: e.target.value }))} placeholder="tag1, tag2" /></div>
            <div>
              <Label>{t("status_col")}</Label>
              <select className="w-full rounded-lg border px-3 py-2 text-sm" value={articleData.status} onChange={e => setArticleData(p => ({ ...p, status: e.target.value }))}>
                <option value="draft">{t("draft")}</option>
                <option value="published">{t("published")}</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !articleData.title_fr || !articleData.content_fr}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

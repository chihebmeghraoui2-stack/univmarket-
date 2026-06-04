import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Megaphone, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminBroadcast() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error(t("send_error"));
      return res.json();
    },
    onSuccess: (data) => {
      setSent(data.sent);
      setTitle(""); setBody("");
      toast({ title: `${t("message_sent_to")} ${data.sent} ${t("sellers_label")}!` });
    },
    onError: () => toast({ title: t("order_error"), variant: "destructive" }),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Megaphone className="h-6 w-6 text-primary" />{t("broadcast_title")}
      </h1>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />{t("send_important_notification")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">{t("broadcast_warning")}</div>
          <div className="space-y-2">
            <Label>{t("message_title")}</Label>
            <Input placeholder={t("broadcast_title_placeholder")} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("message_content")}</Label>
            <Textarea placeholder={t("broadcast_content_placeholder")} value={body} onChange={e => setBody(e.target.value)} rows={5} />
          </div>
          {sent !== null && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
              <CheckCircle className="h-4 w-4" />
              {t("message_sent_success")} <strong>{sent}</strong> {t("sellers_label")}.
            </div>
          )}
          <Button className="w-full" onClick={() => broadcastMutation.mutate()} disabled={broadcastMutation.isPending || !title || !body}>
            <Send className="h-4 w-4 mr-2" />
            {broadcastMutation.isPending ? t("sending") : t("send_to_all_sellers")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

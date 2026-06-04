import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function TwoFactorPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const { data: status } = useQuery({
    queryKey: ["/api/2fa/status"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/2fa/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      return res.json();
    },
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      return res.json();
    },
    onSuccess: (data) => setQrCode(data.qrCode),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
        body: JSON.stringify({ token: code }),
      });
      if (!res.ok) throw new Error(t("invalid_code"));
      return res.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setQrCode(""); setCode("");
      toast({ title: t("tfa_enabled") });
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
    },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
        body: JSON.stringify({ token: code }),
      });
      if (!res.ok) throw new Error(t("invalid_code"));
      return res.json();
    },
    onSuccess: () => {
      setCode("");
      toast({ title: t("tfa_disabled") });
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
    },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6" /> {t("tfa_title")}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("status_col")}
            <Badge className={status?.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {status?.enabled ? t("tfa_active") : t("tfa_inactive")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.enabled ? (
            <>
              {!qrCode ? (
                <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending} className="w-full">
                  {t("setup_tfa")}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("scan_qr")}</p>
                  <img src={qrCode} alt="QR Code 2FA" className="mx-auto border rounded-lg p-2" />
                  <Input placeholder={t("enter_6_digits")} value={code} onChange={e => setCode(e.target.value)}
                    maxLength={6} className="text-center text-lg tracking-widest" />
                  <Button onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending || code.length !== 6} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />{t("enable_tfa")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                <CheckCircle className="h-4 w-4" />{t("tfa_protects")}
              </div>
              <Input placeholder={t("tfa_code_to_disable")} value={code} onChange={e => setCode(e.target.value)}
                maxLength={6} className="text-center text-lg tracking-widest" />
              <Button variant="destructive" onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending || code.length !== 6} className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" />{t("disable_tfa")}
              </Button>
            </div>
          )}
          {backupCodes.length > 0 && (
            <div className="space-y-2 p-4 bg-yellow-50 rounded-lg">
              <p className="font-semibold text-sm text-yellow-800">{t("save_backup_codes")}</p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((c) => (
                  <code key={c} className="text-xs bg-white px-2 py-1 rounded border text-center">{c}</code>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

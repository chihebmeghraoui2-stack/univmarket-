import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/utils";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerSent, setSellerSent] = useState(false);

  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("order_error"));
      return data;
    },
    onSuccess: () => { setStep(2); toast({ title: t("code_sent") }); },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error(t("passwords_dont_match"));
      if (newPassword.length < 6) throw new Error(t("min_6_chars"));
      const res = await apiFetch("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("invalid_code"));
      return data;
    },
    onSuccess: () => { toast({ title: t("password_changed") }); navigate("/login"); },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  const sellerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/auth/seller-forgot-password", { method: "POST", body: JSON.stringify({ email: sellerEmail }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("order_error"));
      return data;
    },
    onSuccess: () => setSellerSent(true),
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle className="text-center">{t("forgot_password")}</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="client">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="client" className="flex-1">{t("i_am_student")}</TabsTrigger>
              <TabsTrigger value="seller" className="flex-1">{t("i_am_seller")}</TabsTrigger>
            </TabsList>
            <TabsContent value="client" className="space-y-4">
              {step === 1 ? (<>
                <div className="space-y-2">
                  <Label>{t("email")}</Label>
                  <Input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => sendCodeMutation.mutate()} disabled={sendCodeMutation.isPending || !email}>
                  {sendCodeMutation.isPending ? t("sending") : t("send_code")}
                </Button>
              </>) : (<>
                <p className="text-sm text-muted-foreground">{t("code_sent_to")} <strong>{email}</strong></p>
                <div className="space-y-2">
                  <Label>{t("five_digit_code")}</Label>
                  <Input placeholder="12345" maxLength={5} value={code} onChange={e => setCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("new_password")}</Label>
                  <Input type="password" placeholder={t("min_6_chars")} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("confirm_password")}</Label>
                  <Input type="password" placeholder={t("repeat")} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending || !code || !newPassword}>
                  {resetMutation.isPending ? t("changing") : t("change_password")}
                </Button>
                <button className="text-sm text-primary hover:underline w-full text-center" onClick={() => setStep(1)}>{t("back")}</button>
              </>)}
            </TabsContent>
            <TabsContent value="seller" className="space-y-4">
              {sellerSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="text-4xl">✅</div>
                  <h3 className="font-semibold">{t("request_sent")}</h3>
                  <p className="text-sm text-muted-foreground">{t("seller_reset_desc")}</p>
                </div>
              ) : (<>
                <p className="text-sm text-muted-foreground">{t("seller_reset_manual")}</p>
                <div className="space-y-2">
                  <Label>{t("email")}</Label>
                  <Input type="email" placeholder="votre@email.com" value={sellerEmail} onChange={e => setSellerEmail(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => sellerMutation.mutate()} disabled={sellerMutation.isPending || !sellerEmail}>
                  {sellerMutation.isPending ? t("sending") : t("send_request")}
                </Button>
              </>)}
            </TabsContent>
          </Tabs>
          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-primary hover:underline">{t("back_to_login")}</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
const fs = require('fs');
const content = `import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Loader2, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [adminKeyOpen, setAdminKeyOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  const adminLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:3000/api/auth/admin-key-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: adminKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Cle invalide");
      return data;
    },
    onSuccess: (data: any) => {
      localStorage.setItem("univmarket_token", data.token);
      localStorage.setItem("univmarket_user", JSON.stringify(data.user));
      setAdminKeyOpen(false);
      window.location.href = "/admin";
    },
    onError: () => toast({ title: "Cle invalide", variant: "destructive" }),
  });

  const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: any) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user as any);
        toast({ title: t("login_success"), description: res.user.name });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ title: t("login_error"), description: t("login_error_desc"), variant: "destructive" });
      },
    });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl gradient-teal flex items-center justify-center text-white font-extrabold text-lg mb-3">UM</div>
            <h1 className="text-2xl font-extrabold text-foreground">UnivMarket</h1>
            <p className="text-sm text-muted-foreground">{t("hero_badge")}</p>
          </div>
          <Card className="border-border/60 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{t("login_title")}</CardTitle>
              <CardDescription>{t("login_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl><Input type="email" placeholder="votre@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("password")}</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full gradient-teal text-white border-none h-11" disabled={loginMutation.isPending}>
                    {loginMutation.isPending
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("connecting")}</>
                      : <><LogIn className="h-4 w-4 mr-2" />{t("connect")}</>}
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
                <div>
                  {t("no_account")}{" "}
                  <Link href="/register" className="text-primary font-medium hover:underline">{t("register_free")}</Link>
                </div>
                <div>
                  <button type="button" onClick={() => setAdminKeyOpen(true)} className="text-primary font-medium hover:underline">
                    Acces administrateur
                  </button>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{t("demo_accounts")}</p>
                <p>Admin: <span className="font-mono">admin@univmarket.dz</span> / <span className="font-mono">Admin123!</span></p>
                <p>Vendeur: <span className="font-mono">seller@univmarket.dz</span> / <span className="font-mono">Seller123!</span></p>
                <p>Client: <span className="font-mono">client@univmarket.dz</span> / <span className="font-mono">Client123!</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={adminKeyOpen} onOpenChange={setAdminKeyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Acces administrateur</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              type="password"
              placeholder="Cle secrete"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adminLoginMutation.mutate()}
            />
            <Button className="w-full" onClick={() => adminLoginMutation.mutate()} disabled={adminLoginMutation.isPending || !adminKey}>
              {adminLoginMutation.isPending ? "Verification..." : "Acceder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
`;
fs.writeFileSync('E:/proget uni/projet2/artifacts/univmarket/src/pages/login.tsx', content, 'utf8');
console.log('Done');

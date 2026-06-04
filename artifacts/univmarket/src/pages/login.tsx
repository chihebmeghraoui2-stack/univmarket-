import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLogin, setAuthTokenGetter } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Loader2, LogIn, GraduationCap, BookOpen, Users, Star, ShieldCheck, Zap, ShieldOff } from "lucide-react";
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
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/auth/admin-key-login", {
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
        localStorage.setItem("univmarket_token", res.token);
        localStorage.setItem("univmarket_user", JSON.stringify(res.user));
        toast({ title: t("login_success"), description: res.user.name });
        setTimeout(() => { window.location.href = res.user.role === "admin" ? "/admin" : "/dashboard"; }, 300);
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.error || error?.message || "";
        if (msg.includes("banni") || msg.includes("Compte banni")) {
          const reason = msg.replace("Compte banni: ", "").trim();
          localStorage.setItem("banned_reason", reason || "Violation des conditions d utilisation.");
          window.location.href = "/banned";
        } else {
          toast({ title: t("login_error"), description: t("login_error_desc"), variant: "destructive" });
        }
      },
    });
  };

  const panelStyle: React.CSSProperties = {
    backgroundImage: "url(/photo.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
  const accentColor = "#93c5fd";

  return (
    <>
      <div
        className="relative min-h-screen flex overflow-x-hidden"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ backgroundImage: "url('/photo.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" />
        <div className="relative z-10 w-full">
          <div className="min-h-screen flex w-full">

            {/* LEFT panel */}
            <div className="hidden lg:flex lg:w-1/2 relative" style={{ backgroundImage: "url(/photo.png)", backgroundSize: "cover", backgroundPosition: "center" }}>
            </div>
            {/* RIGHT panel */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900 min-h-screen">
              <div className="w-full max-w-md space-y-6 pt-4">

                {/* Logo */}
                <div className="flex flex-col items-center text-center mb-2">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-3"
                    style={{ background: "linear-gradient(135deg, #0d2d6e, #2563eb)" }}>
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">UnivMarket</h1>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5 font-medium tracking-widest uppercase">Plateforme Universitaire Algerienne</p>
                  <div className="w-12 h-0.5 rounded-full mt-2" style={{ background: "linear-gradient(90deg, #0d2d6e, #2563eb)" }} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("login_title")}</h2>
                  <p className="text-sm text-gray-400 dark:text-slate-400 mt-1">{t("login_desc")}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 space-y-5" style={{ boxShadow: "0 8px 40px rgba(13,45,110,0.10)" }}>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-slate-300">{t("email")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="votre@email.com" className="h-11 rounded-xl border-gray-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-slate-300">{t("password")}</FormLabel>
                            <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "#2563eb" }}>
                              Mot de passe oublie ?
                            </Link>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="h-11 rounded-xl border-gray-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit"
                        className="w-full h-12 rounded-xl text-white font-semibold text-sm border-none tracking-wide"
                        style={{ background: "linear-gradient(135deg, #0d2d6e 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(37,99,235,0.4)" }}
                        disabled={loginMutation.isPending}>
                        {loginMutation.isPending
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("connecting")}</>
                          : <><LogIn className="h-4 w-4 mr-2" />{t("connect")}</>}
                      </Button>
                    </form>
                  </Form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                    <div className="relative flex justify-center text-xs text-gray-400 bg-white dark:bg-slate-800 px-2">ou</div>
                  </div>

                  <div className="text-center text-sm space-y-2">
                    <p className="text-muted-foreground">
                      {t("no_account")}{" "}
                      <Link href="/register" className="font-semibold hover:underline" style={{ color: "#2563eb" }}>{t("register_free")}</Link>
                    </p>
                    <button type="button" onClick={() => setAdminKeyOpen(true)}
                      className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                      Acces administrateur
                    </button>
                  </div>
                </div>

                <div className="rounded-xl p-4 text-xs space-y-1.5" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe" }}>
                  <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> {t("demo_accounts")}
                  </p>
                  <p className="text-blue-800">Admin: <span className="font-mono bg-blue-100 px-1 rounded">admin@univmarket.dz</span> / <span className="font-mono bg-blue-100 px-1 rounded">Admin123!</span></p>
                  <p className="text-blue-800">Vendeur: <span className="font-mono bg-blue-100 px-1 rounded">seller@univmarket.dz</span> / <span className="font-mono bg-blue-100 px-1 rounded">Seller123!</span></p>
                  <p className="text-blue-800">Client: <span className="font-mono bg-blue-100 px-1 rounded">client@univmarket.dz</span> / <span className="font-mono bg-blue-100 px-1 rounded">Client123!</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Dialog open={adminKeyOpen} onOpenChange={setAdminKeyOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Acces administrateur</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input type="password" placeholder="Cle secrete" value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adminLoginMutation.mutate()}
              className="h-11 rounded-xl" />
            <Button className="w-full h-11 rounded-xl border-none text-white"
              style={{ background: "linear-gradient(135deg, #0d2d6e, #2563eb)" }}
              onClick={() => adminLoginMutation.mutate()}
              disabled={adminLoginMutation.isPending || !adminKey}>
              {adminLoginMutation.isPending ? "Verification..." : "Acceder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


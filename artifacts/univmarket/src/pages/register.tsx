import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRegister, useListWilayas } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Loader2, UserPlus, Store, User } from "lucide-react";
import { useTranslation } from "react-i18next";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "seller"]),
  wilaya_id: z.coerce.number().min(1),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export default function Register() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  const [roleTab, setRoleTab] = useState<"client" | "seller">("client");
  const { toast } = useToast();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const { data: _wRaw } = useListWilayas();
  const wilayas: any[] = ([...(Array.isArray(_wRaw) ? _wRaw : (_wRaw as any)?.value ?? [])]).sort((a: any, b: any) => Number(a.code) - Number(b.code));

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "client" as const, wilaya_id: 0, phone: "", bio: "" },
  });

  const handleRoleChange = (role: "client" | "seller") => {
    setRoleTab(role);
    form.setValue("role", role);
  };

  const onSubmit = (data: any) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user as any);
        toast({ title: t("register_success"), description: `${res.user.name}!` });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ title: t("register_error"), description: t("register_error_desc"), variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-teal flex items-center justify-center text-white font-extrabold text-lg mb-3">UM</div>
          <h1 className="text-2xl font-extrabold">{t("register_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("register_subtitle")}</p>
        </div>

        <div className="flex rounded-xl border border-border overflow-hidden bg-card">
          {(["client", "seller"] as const).map(role => (
            <button key={role} type="button" onClick={() => handleRoleChange(role)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${roleTab === role ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {role === "client" ? <User className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              {role === "client" ? t("i_am_student") : t("i_am_seller")}
            </button>
          ))}
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{roleTab === "seller" ? t("reg_title_seller") : t("reg_title_client")}</CardTitle>
            <CardDescription>{roleTab === "seller" ? t("reg_desc_seller") : t("reg_desc_client")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("full_name")}</FormLabel>
                      <FormControl><Input placeholder="Ahmed Benali" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone")} <span className="text-muted-foreground">({t("optional")})</span></FormLabel>
                      <FormControl><Input placeholder="0555 123 456" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
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
                <FormField control={form.control} name="wilaya_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("wilaya")} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={v => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("select_wilaya")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-72 overflow-y-auto">{wilayas.map((w: any) => (
                          <SelectItem key={w.id} value={String(w.id)}>{w.code} - {w.name_fr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {roleTab === "seller" && (
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pro_bio")}</FormLabel>
                      <FormControl><Textarea placeholder={t("bio_placeholder")} rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <Button type="submit" className="w-full h-11 gradient-teal text-white border-none" disabled={registerMutation.isPending}>
                  {registerMutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("creating")}</>
                    : <><UserPlus className="h-4 w-4 mr-2" />{t("create_account")}</>}
                </Button>
              </form>
            </Form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("already_registered")}{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">{t("sign_in")}</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
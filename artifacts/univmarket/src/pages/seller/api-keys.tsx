import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function SellerApiKeys() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  if (!isSeller) { setLocation("/"); return null; }

  const { data: apiKeys, isLoading } = useQuery(["seller-api-keys"], async () => {
    const res = await fetch("/api/api-keys", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error(t("load_error"));
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">{t("api_keys_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("api_keys_desc")}</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !apiKeys?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("no_api_keys")}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t("keys_list")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("full_name")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("key_col")}</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">{t("registration_col")}</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key: any) => (
                  <tr key={key.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{key.name}</td>
                    <td className="py-3 px-4 break-all">{key.key ?? "••••••••"}</td>
                    <td className="py-3 px-4">{new Date(key.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
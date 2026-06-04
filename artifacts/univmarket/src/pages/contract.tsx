import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle, Clock, User, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Contract() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/contracts/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useQuery({
    queryKey: ["/api/contracts", params?.id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${params?.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      if (!res.ok) throw new Error(t("contract_not_found"));
      return res.json();
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contracts/${params?.id}/sign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      if (!res.ok) throw new Error(t("sign_failed"));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("contract_signed"), description: t("signature_saved") });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", params?.id] });
    },
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!contract) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">{t("contract_not_found")}</p>
    </div>
  );

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    signed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    pending: t("pending"), signed: t("signed_status"), cancelled: t("status_cancelled"),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t("contract")} #{contract.id}
            </CardTitle>
            <Badge className={statusColors[contract.status] || ""}>
              {statusLabels[contract.status] ?? contract.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">{contract.title}</h2>
            <p className="text-muted-foreground mt-1 leading-relaxed">{contract.description}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">{t("total_amount")}</p>
              <p className="font-bold text-lg text-primary">{contract.amount} DZD</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">{t("delivery_days")}</p>
              <p className="font-semibold">{contract.deliveryDays} {t("day")}</p>
            </div>
          </div>
          {contract.terms && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">{t("terms_conditions")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{contract.terms}</p>
              </div>
            </>
          )}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold">{t("signatures")}</h3>
            {[
              { label: t("client_label"), signedAt: contract.clientSignedAt },
              { label: t("seller_label"), signedAt: contract.sellerSignedAt },
            ].map(({ label, signedAt }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </div>
                {signedAt ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    {t("signed_on")} {new Date(signedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />{t("pending")}
                  </div>
                )}
              </div>
            ))}
          </div>
          {contract.status === "pending" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {t("sign_warning")}
              </div>
              <Button className="w-full" onClick={() => signMutation.mutate()} disabled={signMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {signMutation.isPending ? t("signing") : t("sign_contract")}
              </Button>
            </div>
          )}
          {contract.status === "signed" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
              <CheckCircle className="h-4 w-4" />
              {t("contract_fully_signed")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
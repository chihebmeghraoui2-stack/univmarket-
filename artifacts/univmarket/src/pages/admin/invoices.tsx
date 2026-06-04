import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminInvoices() {
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: invoices, isLoading } = useQuery(["admin-invoices"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/invoices", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Impossible de charger les factures");
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">Factures</h1>
        <p className="text-muted-foreground text-sm">Suivez les paiements et les factures gأ©nأ©rأ©es.</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>
      ) : !invoices?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Aucune facture trouvأ©e</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Factures rأ©centes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Rأ©fأ©rence</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Commande</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Montant</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">أ‰tat</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">#{invoice.id}</td>
                    <td className="py-3 px-4">{invoice.order_id}</td>
                    <td className="py-3 px-4">{invoice.amount?.toLocaleString()} DZD</td>
                    <td className="py-3 px-4">{invoice.status ?? "-"}</td>
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


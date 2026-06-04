import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Wallet, TrendingUp, TrendingDown, ArrowDownToLine, Clock } from "lucide-react";
import { useGetWallet, useListWalletTransactions, useRequestWithdrawal } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function SellerWallet() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const { toast } = useToast();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cib");
  const [page, setPage] = useState(1);

  const { data: wallet, isLoading: walletLoading, refetch } = useGetWallet({ query: { enabled: isSeller } });
  const { data: transactions, isLoading: txLoading } = useListWalletTransactions({ page, limit: 20 });
  const requestWithdrawal = useRequestWithdrawal();

  const TX_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    credit: { label: t("tx_credit"), color: "text-emerald-600", icon: TrendingUp },
    debit: { label: t("tx_debit"), color: "text-red-500", icon: TrendingDown },
    hold: { label: t("tx_hold"), color: "text-amber-600", icon: Clock },
    release: { label: t("tx_release"), color: "text-emerald-600", icon: TrendingUp },
    penalty: { label: t("tx_penalty"), color: "text-red-500", icon: TrendingDown },
  };

  const handleWithdraw = () => {
    const amt = Number(amount);
    if (amt < 1000) { toast({ title: t("min_withdraw"), variant: "destructive" }); return; }
    if (wallet && amt > wallet.balance) { toast({ title: t("insufficient_balance"), variant: "destructive" }); return; }
    requestWithdrawal.mutate(
      { data: { amount: amt, method: method as any } },
      {
        onSuccess: () => { setWithdrawOpen(false); toast({ title: t("withdraw_submitted") }); refetch(); },
        onError: () => toast({ title: t("order_error"), variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-extrabold">{t("my_wallet")}</h1>

      {walletLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : wallet ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{t("available_balance")}</p>
              <p className="text-3xl font-extrabold text-primary">{wallet.balance.toLocaleString()} DZD</p>
              <Button size="sm" onClick={() => setWithdrawOpen(true)} className="mt-2 gap-1.5 gradient-teal text-white border-none">
                <ArrowDownToLine className="h-4 w-4" />{t("withdraw")}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{t("pending_escrow")}</p>
              <p className="text-2xl font-extrabold text-amber-600">{wallet.pending_balance.toLocaleString()} DZD</p>
              <p className="text-xs text-muted-foreground">{t("released_after_confirm")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{t("total_earned")}</p>
              <p className="text-2xl font-extrabold text-foreground">{wallet.total_earned.toLocaleString()} DZD</p>
              <p className="text-xs text-muted-foreground">{t("withdrawn")}: {wallet.total_withdrawn.toLocaleString()} DZD</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{t("tx_history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : !transactions?.data?.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">{t("no_transactions")}</p>
          ) : (
            <div className="space-y-2">
              {transactions.data.map((tx: any) => {
                const cfg = TX_TYPE_CONFIG[tx.type] ?? { label: tx.type, color: "text-foreground", icon: Wallet };
                const Icon = cfg.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tx.description ?? cfg.label}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${tx.type === "credit" || tx.type === "release" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.type === "credit" || tx.type === "release" ? "+" : "-"}{tx.amount.toLocaleString()} DZD
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          {transactions && transactions.total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(transactions.total / 20)}>{t("next")}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("withdraw_request")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t("available_balance")}: <span className="font-bold text-primary">{wallet?.balance.toLocaleString()} DZD</span></p>
            <div className="space-y-1.5">
              <Label>{t("amount_min")}</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 5000" min={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("withdraw_method")}</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cib">CIB</SelectItem>
                  <SelectItem value="baridimob">BaridiMob</SelectItem>
                  <SelectItem value="dahabia">Dahabia</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleWithdraw} disabled={requestWithdrawal.isPending} className="gradient-teal text-white border-none">
              {requestWithdrawal.isPending ? t("processing") : t("request_withdraw")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
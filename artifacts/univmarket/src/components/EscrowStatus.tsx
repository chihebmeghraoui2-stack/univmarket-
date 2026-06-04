import { CheckCircle, Clock, CreditCard, Lock, Package } from "lucide-react";

interface EscrowStatusProps {
  status: "held" | "released" | "refunded" | "disputed";
  totalAmount: number;
  commissionAmount: number;
  sellerAmount: number;
  heldAt?: string;
  releasedAt?: string;
}

const steps = [
  { id: "held", label: "Séquestre", icon: CreditCard },
  { id: "released", label: "Libéré", icon: Lock },
  { id: "refunded", label: "Remboursé", icon: Clock },
  { id: "disputed", label: "Litige", icon: Package },
  { id: "completed", label: "Terminée", icon: CheckCircle },
] as const;

export default function EscrowStatus({ status, totalAmount, commissionAmount, sellerAmount, heldAt, releasedAt }: EscrowStatusProps) {
  const activeIndex = steps.findIndex((step) => step.id === status) !== -1 ? steps.findIndex((step) => step.id === status) : 0;
  const isDisputed = status === "disputed";

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="flex min-w-[520px] items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {steps.map((step, index) => {
            const isPast = index < activeIndex;
            const isActive = index === activeIndex;
            const color = isDisputed && step.id === "disputed" ? "border-red-500 bg-red-100 text-red-700" : isActive ? "border-blue-500 bg-blue-100 text-blue-800" : isPast ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-slate-300 bg-slate-100 text-slate-700";
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex min-w-[120px] flex-col items-center gap-3 text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  {step.id === "held" && heldAt ? <p className="text-xs text-muted-foreground">{heldAt}</p> : null}
                  {step.id === "released" && releasedAt ? <p className="text-xs text-muted-foreground">{releasedAt}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-muted-foreground">Montant total</p>
          <p className="mt-2 text-xl font-semibold">{totalAmount.toLocaleString()} DZD</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-muted-foreground">Commission</p>
          <p className="mt-2 text-xl font-semibold">{commissionAmount.toLocaleString()} DZD</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-muted-foreground">Reste vendeur</p>
          <p className="mt-2 text-xl font-semibold">{sellerAmount.toLocaleString()} DZD</p>
        </div>
      </div>
    </div>
  );
}

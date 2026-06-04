import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Star, X, Send, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Service {
  id: number;
  title_fr: string;
  images: string[];
  price: number;
  status: string;
}

interface TrendingRequest {
  id: number;
  service_id: number;
  title_fr: string;
  images: string[];
  price: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
}

interface Props {
  sellerServices: Service[];
}

export default function TrendingRequestWidget({ sellerServices }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Charger la demande existante
  const { data: existingRequest, isLoading } = useQuery<TrendingRequest | null>({
    queryKey: ["trending-request-my"],
    queryFn: async () => {
      const res = await apiFetch("/api/trending-requests/my");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/trending-requests", {
        method: "POST",
        body: JSON.stringify({ service_id: selectedServiceId, message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✅ Demande envoyée à l'admin !" });
      setOpen(false);
      setMessage("");
      setSelectedServiceId(null);
      queryClient.invalidateQueries({ queryKey: ["trending-request-my"] });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/trending-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Demande annulée" });
      queryClient.invalidateQueries({ queryKey: ["trending-request-my"] });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const approvedServices = sellerServices.filter(s => s.status === "approved");

  const statusConfig = {
    pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Acceptée ✨", color: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: "Refusée", color: "bg-red-100 text-red-700", icon: XCircle },
  };

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Produit Tendance</h3>
            <p className="text-xs text-muted-foreground">Mettez votre service en avant sur la page d'accueil</p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-16 bg-white/60 rounded-xl animate-pulse" />
        ) : existingRequest ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-3 flex items-center gap-3 border border-gray-100">
              {existingRequest.images?.[0] && (
                <img src={existingRequest.images[0]} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{existingRequest.title_fr}</p>
                <p className="text-xs text-muted-foreground">{existingRequest.price?.toLocaleString()} DZD</p>
              </div>
              <Badge className={`text-xs ${statusConfig[existingRequest.status]?.color} border-0`}>
                {statusConfig[existingRequest.status]?.label}
              </Badge>
            </div>

            {existingRequest.message && (
              <div className="bg-white/70 rounded-lg px-3 py-2 text-xs text-gray-600 italic border border-gray-100">
                "{existingRequest.message}"
              </div>
            )}

            {existingRequest.admin_note && (
              <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700 border border-red-100">
                <span className="font-semibold">Note admin :</span> {existingRequest.admin_note}
              </div>
            )}

            {existingRequest.status === "pending" && (
              <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                onClick={() => cancelMutation.mutate(existingRequest.id)}
                disabled={cancelMutation.isPending}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Annuler la demande
              </Button>
            )}

            {existingRequest.status !== "pending" && (
              <Button size="sm" className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none"
                onClick={() => setOpen(true)}>
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Nouvelle demande
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Choisissez un de vos services approuvés pour le proposer comme <span className="font-semibold text-purple-700">produit tendance</span> sur la page d'accueil.
            </p>
            {approvedServices.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">Aucun service approuvé disponible</p>
            ) : (
              <Button className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none h-9"
                onClick={() => setOpen(true)}>
                <Star className="h-3.5 w-3.5 mr-1.5" /> Demander mise en tendance
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Demande Produit Tendance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Choisissez votre service :</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {approvedServices.map(s => (
                  <div key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedServiceId === s.id
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-100 hover:border-purple-200 hover:bg-purple-50/50"
                    }`}>
                    {s.images?.[0] && (
                      <img src={s.images[0]} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title_fr}</p>
                      <p className="text-xs text-muted-foreground">{s.price?.toLocaleString()} DZD</p>
                    </div>
                    {selectedServiceId === s.id && (
                      <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Message pour l'admin (optionnel) :</p>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Expliquez pourquoi ce service mérite d'être mis en tendance..."
                rows={3}
                className="rounded-xl resize-none text-sm"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{message.length}/300</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Annuler</Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!selectedServiceId || submitMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none">
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitMutation.isPending ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

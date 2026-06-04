import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

export default function AdminProductArchives() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedArchive, setSelectedArchive] = useState<any>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisArchive, setAnalysisArchive] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [filter, setFilter] = useState<"accepted" | "refused">("accepted");

  const analyzeMutation = useMutation<any, Error, number>({
    mutationFn: async (archiveId) => {
      const res = await apiFetch(`/api/admin/product-chat-archives/${archiveId}/analyze`, { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erreur analyse IA");
      }
      return res.json();
    },
    onSuccess: (data) => setAnalysisResult(data),
  });

  const handleAnalyze = (archive: any) => {
    setAnalysisArchive(archive);
    setAnalysisResult(null);
    setAnalysisOpen(true);
    analyzeMutation.mutate(archive.id);
  };

  const getRiskBadge = (riskLevel: string | undefined) => {
    const normalized = (riskLevel || "low").toLowerCase();
    switch (normalized) {
      case "medium":
        return { label: "🟡 Medium", className: "bg-amber-100 text-amber-700" };
      case "high":
        return { label: "🔴 High", className: "bg-rose-100 text-rose-700" };
      case "critical":
        return { label: "🚨 Critical", className: "bg-red-100 text-red-700" };
      default:
        return { label: "🟢 Low", className: "bg-emerald-100 text-emerald-700" };
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case "phone":
        return "📞";
      case "social_media":
        return "📱";
      case "location":
        return "📍";
      case "bypass_attempt":
        return "⚠️";
      case "personal_info":
        return "👤";
      default:
        return "⚠️";
    }
  };

  if (!isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: archives = [], isLoading } = useQuery<any[]>({
    queryKey: ["adminProductArchives", filter],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/product-chat-archives?status=${filter}`);
      if (!res.ok) throw new Error("Erreur archives");
      return res.json();
    },
  });

  const computeDeleteInDays = (deleteAt: string) => {
    const diff = new Date(deleteAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Archives discussions</h1>

        </div>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          {(["accepted", "refused"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "accepted" ? "Acceptées" : "Refusées"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)}
        </div>
      ) : archives.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-700">Aucune archive trouvée.</div>
      ) : (
        <div className="grid gap-4">
          {archives.map((archive) => (
            <Card key={archive.id} className="overflow-hidden">
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.26fr]">
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Produit</p>
                      <h2 className="text-lg font-semibold">{archive.product?.title ?? "Produit supprimé"}</h2>
                    </div>
                    <div className="grid gap-2 text-right">
                      <Badge>{archive.status}</Badge>
                      <p className="text-sm text-muted-foreground">Suppression dans {computeDeleteInDays(archive.deleteAt)} jours</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
                    <span>Client: {archive.client?.name ?? "--"}</span>
                    <span>Vendeur: {archive.seller?.name ?? "--"}</span>
                    <span>Date: {new Date(archive.archivedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end justify-end sm:flex-row">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyze(archive)}
                    disabled={analyzeMutation.isLoading && analysisArchive?.id === archive.id}
                  >
                    {analyzeMutation.isLoading && analysisArchive?.id === archive.id ? "Analyse en cours..." : "🔍 Analyser avec IA"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">Voir la discussion</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Discussion archivée</DialogTitle>
                        <DialogDescription>{archive.product?.title}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
                          <span>Client: {archive.client?.name}</span>
                          <span>Vendeur: {archive.seller?.name}</span>
                          <span>Statut: {archive.status}</span>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                          {archive.messages?.length ? archive.messages.map((msg: any, index: number) => (
                            <div key={index} className="rounded-2xl bg-white p-3 shadow-sm">
                              <p className="text-sm font-semibold">{msg.senderId === archive.clientId ? archive.client?.name : archive.seller?.name}</p>
                              <p className="text-sm text-slate-700">{msg.body}</p>
                              <p className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</p>
                            </div>
                          )) : (<p className="text-sm text-muted-foreground">Aucun message.</p>)}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Analyse IA de la discussion</DialogTitle>
            <DialogDescription>
              {analysisArchive?.product?.title ?? "Aucune archive sélectionnée"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {analyzeMutation.isLoading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                Analyse en cours, veuillez patienter...
              </div>
            )}

            {analyzeMutation.isError && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Erreur: {analyzeMutation.error?.message}
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-start">
                  <div className="space-y-2">
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getRiskBadge(analysisResult.analysis?.riskLevel).className}`}>
                      {getRiskBadge(analysisResult.analysis?.riskLevel).label}
                    </div>
                    <p className="text-sm text-slate-700">{analysisResult.analysis?.summary}</p>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <span>Contact échangé: {analysisResult.analysis?.contactExchanged ? "✅" : "❌"}</span>
                    <span>Lieu partagé: {analysisResult.analysis?.locationShared ? "✅" : "❌"}</span>
                    <span>Tentative de contournement: {analysisResult.analysis?.bypassRisk ? "✅" : "❌"}</span>
                  </div>
                </div>

                <Separator />

                {analysisResult.analysis?.violations?.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Violations détectées</h3>
                    <ScrollArea className="max-h-96 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="space-y-4">
                        {analysisResult.analysis.violations.map((violation: any, index: number) => (
                          <Card key={index} className="rounded-3xl border border-slate-200 bg-slate-50">
                            <CardContent className="p-4">
                              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                <span>{getViolationIcon(violation.type)}</span>
                                <span>{violation.type}</span>
                                <Badge className="bg-slate-100 text-slate-800">{violation.severity}</Badge>
                              </div>
                              <p className="mt-3 text-sm font-bold text-rose-700">{violation.detected}</p>
                              <p className="mt-2 text-sm text-slate-600">{violation.context}</p>
                              <p className="mt-2 text-sm text-slate-500">{violation.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    ✅ Aucune violation détectée.
                  </div>
                )}

                <Separator />

                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold">Recommandation admin</p>
                  <p className="mt-2">{analysisResult.analysis?.recommendation}</p>
                </div>

                {analysisResult.analysis?.violations?.length > 0 && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => analysisArchive?.id && analyzeMutation.mutate(analysisArchive.id)}
                      disabled={analyzeMutation.isLoading}
                    >
                      Envoyer notification admin
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";


const WILAYAS = [
  {code:"01",name:"Adrar"},{code:"02",name:"Chlef"},{code:"03",name:"Laghouat"},
  {code:"04",name:"Oum El Bouaghi"},{code:"05",name:"Batna"},{code:"06",name:"Bejaia"},
  {code:"07",name:"Biskra"},{code:"08",name:"Bechar"},{code:"09",name:"Blida"},
  {code:"10",name:"Bouira"},{code:"11",name:"Tamanrasset"},{code:"12",name:"Tebessa"},
  {code:"13",name:"Tlemcen"},{code:"14",name:"Tiaret"},{code:"15",name:"Tizi Ouzou"},
  {code:"16",name:"Alger"},{code:"17",name:"Djelfa"},{code:"18",name:"Jijel"},
  {code:"19",name:"Setif"},{code:"20",name:"Saida"},{code:"21",name:"Skikda"},
  {code:"22",name:"Sidi Bel Abbes"},{code:"23",name:"Annaba"},{code:"24",name:"Guelma"},
  {code:"25",name:"Constantine"},{code:"26",name:"Medea"},{code:"27",name:"Mostaganem"},
  {code:"28",name:"MSila"},{code:"29",name:"Mascara"},{code:"30",name:"Ouargla"},
  {code:"31",name:"Oran"},{code:"32",name:"El Bayadh"},{code:"33",name:"Illizi"},
  {code:"34",name:"Bordj Bou Arreridj"},{code:"35",name:"Boumerdes"},{code:"36",name:"El Tarf"},
  {code:"37",name:"Tindouf"},{code:"38",name:"Tissemsilt"},{code:"39",name:"El Oued"},
  {code:"40",name:"Khenchela"},{code:"41",name:"Souk Ahras"},{code:"42",name:"Tipaza"},
  {code:"43",name:"Mila"},{code:"44",name:"Ain Defla"},{code:"45",name:"Naama"},
  {code:"46",name:"Ain Temouchent"},{code:"47",name:"Ghardaia"},{code:"48",name:"Relizane"},
  {code:"49",name:"Timimoun"},{code:"50",name:"Bordj Badji Mokhtar"},{code:"51",name:"Ouled Djellal"},
  {code:"52",name:"Beni Abbes"},{code:"53",name:"In Salah"},{code:"54",name:"In Guezzam"},
  {code:"55",name:"Touggourt"},{code:"56",name:"Djanet"},{code:"57",name:"El MGhair"},
  {code:"58",name:"El Meniaa"}
];

const PILOT_WILAYAS = [{name:"Alger"},{name:"Oran"},{name:"Constantine"},{name:"Tlemcen"},{name:"Tizi Ouzou"}];

export default function LancementPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [role, setRole] = useState<"client" | "seller">("client");
  const [shareCopied, setShareCopied] = useState(false);

  const { data: stats, isLoading } = useQuery<{ count: number }>({
    queryKey: ["waiting-list-count"],
    queryFn: async () => {
      const res = await fetch("/api/waiting-list/count");
      if (!res.ok) throw new Error(t("load_error"));
      return res.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, wilaya, role }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? t("send_error"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("registration_saved"), description: t("will_be_notified") });
      setEmail(""); setWilaya(null); setRole("client");
    },
    onError: (error: any) => toast({ title: t("order_error"), description: error.message, variant: "destructive" }),
  });

  const shareUrl = useMemo(() => typeof window !== "undefined" ? window.location.href : "", []);

  return (
    <div className="space-y-16 px-4 py-10" dir={isRTL ? "rtl" : "ltr"}>
      <section className="mx-auto max-w-7xl text-center">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-widest text-primary">{t("coming_soon")}</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t("launch_title")}</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">{t("launch_desc")}</p>
          <div className="grid gap-4 sm:grid-cols-2 sm:justify-center">
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(shareUrl); setShareCopied(true); toast({ title: t("link_copied") }); }}>
              {shareCopied ? t("link_copied") : t("copy_link")}
            </Button>
            <Button asChild>
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(t("whatsapp_share") + " " + shareUrl)}`} target="_blank" rel="noreferrer">
                {t("share_whatsapp")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-2xl font-semibold">{t("countdown_title")}</h2>
              <p className="text-muted-foreground">{t("launch_date_desc")}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {PILOT_WILAYAS.map((region) => (
              <Card key={region.name} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{region.name}</p>
                      <p className="text-sm text-muted-foreground">{t("pilot_wilaya")}</p>
                    </div>
                    <Badge variant="secondary">{t("pilot")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-950 text-white">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm uppercase tracking-widest text-slate-300">{t("statistics")}</p>
              <p className="text-3xl font-bold">{isLoading ? <Skeleton className="h-10 w-24" /> : stats?.count ?? 0}</p>
              <p className="text-slate-400">{t("waitlist_count")}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20">
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">{t("waiting_list")}</p>
              <h2 className="text-2xl font-semibold">{t("join_community")}</h2>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.dz" />
              </div>
              <div>
                <Label htmlFor="wilaya">{t("wilaya")}</Label>
                <Select value={wilaya ?? ""} onValueChange={v => setWilaya(v || null)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t("choose_wilaya")} /></SelectTrigger>
                  <SelectContent className="max-h-72 overflow-y-auto">{WILAYAS.map(w => <SelectItem key={w.code} value={w.name}>{w.code} - {w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">{t("you_are")}</Label>
                <Select value={role} onValueChange={v => setRole(v as any)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72 overflow-y-auto">
                    <SelectItem value="client">{t("client_label")}</SelectItem>
                    <SelectItem value="seller">{t("seller_label")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending || !email || !wilaya}>
                {joinMutation.isPending ? t("sending") : t("join")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
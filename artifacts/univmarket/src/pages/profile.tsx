import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/utils";
import { MapPin, Star, Calendar, MessageSquare, ArrowLeft, Award, TrendingUp, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WilayaSelector from "@/components/WilayaSelector";
import { useTranslation } from "react-i18next";

type UserProfile = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  wilaya_id?: number | null;
  wilaya_name_fr?: string | null;
  avatar?: string | null;
  bio?: string | null;
  trust_score?: number | null;
  created_at: string;
  services_count?: number;
  avg_rating?: number | null;
  reviews_count?: number;
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/profile/:id");
  const userId = Number(params?.id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editWilayaId, setEditWilayaId] = useState<number | null>(null);

  const currentUserId = useMemo<number | null>(() => {
    try {
      const stored = localStorage.getItem("univmarket_user");
      return stored ? JSON.parse(stored)?.id ?? null : null;
    } catch {
      return null;
    }
  }, []);

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name ?? "");
    setEditEmail(profile.email ?? "");
    setEditPhone((profile as any).phone ?? "");
    setEditWilayaId((profile as any).wilaya_id ?? null);
    setEditPassword("");
    setEditOpen(true);
  };

  const updateProfile = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apifetch((import.meta.env.VITE_API_URL || "") + "/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur mise  jour");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profil mis  jour !" });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre  jour le profil", variant: "destructive" });
    },
  });

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") resolve(result);
          else reject(new Error("Impossible de lire le fichier"));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const res = await apifetch((import.meta.env.VITE_API_URL || "") + "/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ avatar: base64 }),
      });

      if (!res.ok) {
        throw new Error("Impossible de mettre  jour l'avatar");
      }

      await queryClient.invalidateQueries(["profile", userId]);
      event.target.value = "";
    } catch (error) {
      console.error(error);
    }
  };

  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID missing");
      const res = await apiFetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
    enabled: !!userId,
  });

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );

  if (isError || !profile) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <h2 className="text-xl font-semibold mb-4">{t("profile_not_found")}</h2>
      <Button onClick={() => navigate("/")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />{t("back_home")}
      </Button>
    </div>
  );

  const trustScore = profile.trust_score ?? 0;
  const trustScoreColor = trustScore >= 80 ? "text-green-600" : trustScore >= 60 ? "text-amber-600" : "text-red-600";
  const createdDate = new Date(profile.created_at);
  const monthsActive = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const isOwnProfile = currentUserId === userId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />{t("back")}
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
            <div className="relative">
              <Avatar className="h-32 w-32 shrink-0">
                <AvatarImage src={profile.avatar ?? undefined} alt={profile.name} />
                <AvatarFallback className="text-2xl">{profile.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 shadow-md hover:bg-slate-50"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  {profile.role === "admin" && (
                      <span title="Administrateur UnivMarket" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"linear-gradient(135deg,#1e3a8a,#2563eb)",boxShadow:"0 2px 8px rgba(37,99,235,0.4)"}}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span style={{fontSize:10,fontWeight:700,color:"white",letterSpacing:1}}>ADMIN</span>
                      </span>
                    )}
                    {profile.role === "seller" && (profile.trust_score ?? 0) >= 75 && (
                      <span title="Vendeur Officiel" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"linear-gradient(135deg,#065f46,#10b981)",boxShadow:"0 2px 8px rgba(16,185,129,0.4)"}}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span style={{fontSize:10,fontWeight:700,color:"white",letterSpacing:1}}>OFFICIEL</span>
                      </span>
                    )}
                    <Badge variant="outline" className="uppercase">{profile.role}</Badge>
                </div>
                {profile.wilaya_name_fr && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /><span>{profile.wilaya_name_fr}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="text-sm text-muted-foreground">
                    <strong>{t("email")}:</strong> {profile.email}
                  </div>
                )}
                {profile.bio && <p className="text-sm text-muted-foreground pt-2">{profile.bio}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">{t("services")}</p>
                  <p className="text-2xl font-bold">{profile.services_count ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">{t("avg_rating")}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{profile.avg_rating?.toFixed(1) ?? "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">{t("trust_score")}</p>
                  <p className={`text-2xl font-bold ${trustScoreColor}`}>{trustScore}%</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button className="gap-2" onClick={() => window.location.href = `/seller-chat/${userId}`}>
                  <MessageSquare className="h-4 w-4" />Contacter
                </Button>
                {isOwnProfile && (
                  <>
                    <Button variant="secondary" className="gap-2" onClick={handleOpenEdit}>
                      Modifier mon profil
                    </Button>
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogContent dir={isRTL ? "rtl" : "ltr"}>
                        <DialogHeader>
                          <DialogTitle>Modifier mon profil</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Nom complet</Label>
                              <Input id="edit-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Tlphone</Label>
                              <Input id="edit-phone" value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Adresse email</Label>
                              <Input id="edit-email" type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-password">Mot de passe <span className="text-muted-foreground">(optionnel)</span></Label>
                              <Input
                                id="edit-password"
                                type="password"
                                placeholder="Laisser vide pour conserver le mot de passe"
                                value={editPassword}
                                onChange={(event) => setEditPassword(event.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Wilaya</Label>
                              <WilayaSelector value={editWilayaId} onChange={setEditWilayaId} />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Annuler
                          </Button>
                          <Button
                            onClick={() => {
                              const body: Record<string, unknown> = {
                                name: editName,
                                phone: editPhone,
                                email: editEmail,
                              };
                              if (editWilayaId !== null) {
                                body.wilaya_id = editWilayaId;
                              }
                              if (editPassword.trim()) {
                                body.password = editPassword;
                              }
                              updateProfile.mutate(body);
                            }}
                            disabled={updateProfile.isLoading}
                          >
                            {updateProfile.isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-100 rounded-lg"><Calendar className="h-5 w-5 text-blue-600" /></div>
              <div className="space-y-1 flex-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">{t("member_since")}</p>
                <p className="font-semibold">{createdDate.toLocaleDateString(i18n.language === "ar" ? "ar-DZ" : "fr-DZ", { month: "long", year: "numeric" })}</p>
                <p className="text-xs text-muted-foreground">{monthsActive} {t("months")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 rounded-lg"><Award className="h-5 w-5 text-amber-600" /></div>
              <div className="space-y-1 flex-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">{t("reviews_received")}</p>
                <p className="font-semibold">{profile.reviews_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("from_sellers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />{t("trust_score_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{t("trust_score_based_on")}</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t("trust_factor_1")}</li>
              <li>{t("trust_factor_2")}</li>
              <li>{t("trust_factor_3")}</li>
              <li>{t("trust_factor_4")}</li>
              <li>{t("trust_factor_5")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

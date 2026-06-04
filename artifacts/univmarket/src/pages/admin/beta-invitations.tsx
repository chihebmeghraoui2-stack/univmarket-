import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminBetaInvitations() {
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: invitations, isLoading } = useQuery(["admin-beta-invitations"], async () => {
    const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/beta-invitations", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Impossible de charger les invitations");
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">Invitations beta</h1>
        <p className="text-muted-foreground text-sm">Gأ©rez les invitations أ  la plateforme en phase beta.</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>
      ) : !invitations?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Aucune invitation en attente</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Invitations rأ©centes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Email</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Code</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Statut</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Crأ©أ© le</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation: any) => (
                  <tr key={invitation.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{invitation.email}</td>
                    <td className="py-3 px-4">{invitation.invitation_code}</td>
                    <td className="py-3 px-4">{invitation.used ? "Utilisأ©e" : "Disponible"}</td>
                    <td className="py-3 px-4">{new Date(invitation.created_at).toLocaleDateString()}</td>
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


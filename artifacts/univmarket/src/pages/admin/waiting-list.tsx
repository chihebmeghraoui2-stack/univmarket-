import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminWaitingList() {
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { data: waitingList, isLoading } = useQuery(["admin-waiting-list"], async () => {
    const res = await fetch("/api/waiting-list", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Impossible de charger la liste d'attente");
    return res.json();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-extrabold">Liste d'attente</h1>
        <p className="text-muted-foreground text-sm">Visualisez les inscriptions en attente de validation.</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>
      ) : !waitingList?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Aucun enregistrement trouvأ©</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Abonnأ©s</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Email</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Wilaya</th>
                  <th className="py-3 px-4 text-left text-xs text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {waitingList.map((entry: any) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">{entry.email}</td>
                    <td className="py-3 px-4">{entry.wilaya_name ?? entry.wilaya_id}</td>
                    <td className="py-3 px-4">{new Date(entry.created_at).toLocaleDateString()}</td>
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

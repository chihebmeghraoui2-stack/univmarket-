import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, ExternalLink, Trash2 } from "lucide-react";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { data: notifs, isLoading, refetch } = useListNotifications(
    { page, limit: 20 },
    { query: { enabled: isAuthenticated } }
  );
  const markRead = useMarkNotificationRead();

  const deleteNotif = async (id: number, isRead: boolean) => {
    if (!isRead) {
      toast({ title: "Marquez d'abord la notification comme lue", variant: "destructive" });
      return;
    }
    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) { refetch(); toast({ title: "Notification supprimée" }); }
      else toast({ title: "Erreur", variant: "destructive" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const deleteAllRead = async () => {
    try {
      const res = await apiFetch("/api/notifications", { method: "DELETE" });
      if (res.ok) { refetch(); toast({ title: "Notifications lues supprimées" }); }
      else toast({ title: "Erreur", variant: "destructive" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  if (!isAuthenticated) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-muted-foreground">{t("login_to_see")} {t("your_notifications")}</p>
      <Link href="/login"><Button className="mt-4">{t("login")}</Button></Link>
    </div>
  );

  const readCount = notifs?.data?.filter((n: any) => n.is_read).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{t("notifications")}</h1>
          {notifs && <p className="text-muted-foreground text-sm">{notifs.unread_count} {t("unread")}</p>}
        </div>
        {readCount > 0 && (
          <Button variant="outline" size="sm" onClick={deleteAllRead} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer les lues ({readCount})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !notifs?.data?.length ? (
        <div className="py-16 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold mb-2">{t("no_notifs")}</h3>
          <p className="text-sm text-muted-foreground">{t("notifs_desc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.data.map((n: any) => (
            <Card key={n.id}
              className={`cursor-pointer hover:shadow-md transition-all ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}
              onClick={() => !n.is_read && markRead.mutate({ id: n.id }, { onSuccess: refetch })}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.is_read && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Marquer comme lue"
                      onClick={e => { e.stopPropagation(); markRead.mutate({ id: n.id }, { onSuccess: refetch }); }}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {n.link && (
                    <Link href={n.link}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                  <Button size="icon" variant="ghost"
                    className={`h-7 w-7 ${n.is_read ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground/30 cursor-not-allowed"}`}
                    title={n.is_read ? "Supprimer" : "Marquez comme lue d'abord"}
                    onClick={e => { e.stopPropagation(); deleteNotif(n.id, n.is_read); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {notifs && notifs.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(notifs.total / 20)}>{t("next")}</Button>
        </div>
      )}
    </div>
  );
}

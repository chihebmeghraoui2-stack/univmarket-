import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, CheckCircle, ShieldOff, Shield, XCircle, AlertTriangle } from "lucide-react";
import { useAdminListUsers, useAdminBanUser, useAdminUnbanUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!isAdmin) { setLocation("/"); return null; }

  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [banUserId, setBanUserId] = useState<number | null>(null);
  const [banReason, setBanReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, isLoading, refetch } = useAdminListUsers({
    search: search || undefined,
    role: role !== "all" ? role as any : undefined,
    page, limit: 20,
  });
  const banUser = useAdminBanUser();
  const unbanUser = useAdminUnbanUser();
  const verifyUser = async (userId: number) => {
    const token = localStorage.getItem("univmarket_token");
    const res = await fetch(`/api/admin/users/${userId}/verify`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { refetch(); toast({ title: "Utilisateur verifie !" }); }
    else toast({ title: "Erreur", variant: "destructive" });
  };

  const handleBan = () => {
    if (!banUserId || !banReason) return;
    banUser.mutate({ id: banUserId!, data: { reason: banReason } }, {
      onSuccess: () => { setBanUserId(null); setBanReason(""); refetch(); toast({ title: t("user_banned") }); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" }),
    });
  };

  const handleUnban = (userId: number) => {
    unbanUser.mutate({ id: userId }, {
      onSuccess: () => { refetch(); toast({ title: t("user_unbanned") }); },
      onError: () => toast({ title: t("order_error"), variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />{t("user_management")}</h1>
        <p className="text-muted-foreground text-sm">{users?.total ?? 0} {t("admin_users")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t("search_users_placeholder")} className="pl-9" />
        </div>
        <Select value={role} onValueChange={v => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_roles")}</SelectItem>
            <SelectItem value="client">{t("clients")}</SelectItem>
            <SelectItem value="seller">{t("sellers_label")}</SelectItem>
            <SelectItem value="admin">{t("admins")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !users?.data?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t("no_users_found")}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t("user_col")}</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t("role_col")}</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t("status_col")}</th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t("registration_col")}</th>
                    <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">{t("actions_col")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u: any) => (
                    <tr key={u.id} onClick={() => setSelectedUser(u)} className="cursor-pointer border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={u.avatar ?? undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge variant="secondary" className="capitalize text-xs">{u.role}</Badge></td>
                      <td className="py-3 px-4">
                        {u.banned_at ? (
                          <Badge className="text-xs bg-red-100 text-red-700 border-none flex items-center gap-1"><XCircle className="h-3 w-3" />Banni</Badge>
                        ) : u.verified_at ? (
                          <Badge className="text-xs bg-green-100 text-green-700 border-none flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" />Verifie</Badge>
                        ) : (
                          <button onClick={() => verifyUser(u.id)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                            <AlertTriangle className="h-3 w-3" />Non verifie � Cliquer pour verifier
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {u.banned_at ? (
                          <Button size="sm" variant="outline" onClick={() => handleUnban(u.id)} className="text-xs gap-1">
                            <Shield className="h-3 w-3" />{t("unban")}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setBanUserId(u.id)} className="text-xs text-destructive border-destructive/30 gap-1">
                            <ShieldOff className="h-3 w-3" />{t("ban")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {users && users.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("previous")}</Button>
          <span className="text-sm text-muted-foreground">{t("page")} {page} / {Math.ceil(users.total / 20)}</span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(users.total / 20)}>{t("next")}</Button>
        </div>
      )}

      

      <Dialog open={!!banUserId} onOpenChange={() => setBanUserId(null)}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("ban_user_title")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>{t("ban_reason")}</Label>
            <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder={t("ban_reason_placeholder")} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanUserId(null)}>{t("cancel")}</Button>
            <Button onClick={handleBan} disabled={!banReason || banUser.isPending} variant="destructive">{t("ban")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

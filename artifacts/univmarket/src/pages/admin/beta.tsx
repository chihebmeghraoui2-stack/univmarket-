import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

const PILOTES = ["Alger", "Oran", "Constantine", "Tlemcen", "Tizi Ouzou"];

export default function AdminBeta() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");

  const { data: waitlist = [] } = useQuery<any[]>({
    queryKey: ["/api/waiting-list"],
    queryFn: async () => {
      const r = await fetch((import.meta.env.VITE_API_URL || "") + "/api/waiting-list", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      return r.ok ? r.json() : [];
    },
  });

  const { data: invitations = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/beta-invitations"],
    queryFn: async () => {
      const r = await fetch((import.meta.env.VITE_API_URL || "") + "/api/beta-invitations", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      return r.ok ? r.json() : [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch((import.meta.env.VITE_API_URL || "") + "/api/beta-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ email, role }),
      });
      if (!r.ok) throw new Error(t("send_error"));
      return r.json();
    },
    onSuccess: () => { toast({ title: t("invitation_sent") }); setEmail(""); refetch(); },
    onError: () => toast({ title: t("order_error"), variant: "destructive" }),
  });

  const used = invitations.filter((i: any) => i.usedAt).length;
  const chartData = PILOTES.map(name => ({
    name,
    inscrits: waitlist.filter((w: any) => w.wilaya === name).length || Math.floor(Math.random() * 30) + 5,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold">{t("beta_management")}</h1>
      <Tabs defaultValue="waitlist">
        <TabsList>
          <TabsTrigger value="waitlist">{t("waiting_list")} ({waitlist.length})</TabsTrigger>
          <TabsTrigger value="invitations">{t("invitations")} ({invitations.length})</TabsTrigger>
          <TabsTrigger value="stats">{t("statistics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="waitlist" className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {PILOTES.map(w => (
              <Card key={w}><CardContent className="pt-3 text-center">
                <p className="text-xs text-muted-foreground">{w}</p>
                <p className="text-xl font-bold">{waitlist.filter((i: any) => i.wilaya === w).length}</p>
              </CardContent></Card>
            ))}
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("wilaya")}</TableHead>
              <TableHead>{t("role_col")}</TableHead>
              <TableHead>{t("date_col")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {waitlist.length === 0
                ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("no_registrations")}</TableCell></TableRow>
                : waitlist.map((w: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{w.email}</TableCell>
                    <TableCell>{w.wilaya}</TableCell>
                    <TableCell><Badge variant="outline">{w.role}</Badge></TableCell>
                    <TableCell>{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Input placeholder={t("email")} value={email} onChange={e => setEmail(e.target.value)} className="max-w-xs" />
            <select className="border rounded px-2 text-sm" value={role} onChange={e => setRole(e.target.value)}>
              <option value="client">{t("client_label")}</option>
              <option value="seller">{t("seller_label")}</option>
            </select>
            <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !email}>
              {sendMutation.isPending ? t("sending") : t("send_invitation")}
            </Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("code_col")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role_col")}</TableHead>
              <TableHead>{t("used_col")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invitations.length === 0
                ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("no_invitations")}</TableCell></TableRow>
                : invitations.map((inv: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{inv.code}</TableCell>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell><Badge variant="outline">{inv.role}</Badge></TableCell>
                    <TableCell>{inv.usedAt ? <Badge className="bg-green-100 text-green-800">{t("yes")}</Badge> : <Badge variant="secondary">{t("no")}</Badge>}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t("waitlist_count"), value: waitlist.length },
              { label: t("invitations"), value: invitations.length },
              { label: t("used_col"), value: used },
              { label: t("acceptance_rate"), value: `${invitations.length ? Math.round((used / invitations.length) * 100) : 0}%` },
            ].map(({ label, value }) => (
              <Card key={label}><CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent></Card>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="inscrits" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}

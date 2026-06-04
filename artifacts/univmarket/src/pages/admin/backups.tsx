import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Database, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const mockBackups = [
  { id: 1, type: "database", status: "success", size_mb: 24.5, duration_seconds: 12, created_at: "2025-01-15T02:00:00Z" },
  { id: 2, type: "database", status: "success", size_mb: 23.8, duration_seconds: 11, created_at: "2025-01-14T02:00:00Z" },
  { id: 3, type: "files",    status: "failed",  size_mb: 0,    duration_seconds: 5,  created_at: "2025-01-13T02:00:00Z" },
];

export default function AdminBackups() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();

  const triggerMutation = useMutation({
    mutationFn: async () => {
      await fetch((import.meta.env.VITE_API_URL || "") + "/api/backups/trigger", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    },
    onSuccess: () => toast({ title: t("backup_triggered") }),
    onError: () => toast({ title: t("backup_triggered"), description: "(simulation)" }),
  });

  const total = mockBackups.length;
  const success = mockBackups.filter(b => b.status === "success").length;
  const totalMb = mockBackups.reduce((a, b) => a + b.size_mb, 0).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" /> {t("backups_title")}
        </h1>
        <Button onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending}>
          {triggerMutation.isPending ? t("in_progress_btn") : t("trigger_backup")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">{t("total_col")}</p>
          <p className="text-2xl font-bold">{total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">{t("success_rate")}</p>
          <p className="text-2xl font-bold text-green-600">{Math.round((success / total) * 100)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">{t("total_size")}</p>
          <p className="text-2xl font-bold">{totalMb} MB</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("backup_history")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("type_col")}</TableHead>
                <TableHead>{t("status_col")}</TableHead>
                <TableHead>{t("size_col")}</TableHead>
                <TableHead>{t("duration_col")}</TableHead>
                <TableHead>{t("date_col")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBackups.map(b => (
                <TableRow key={b.id}>
                  <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
                  <TableCell>
                    {b.status === "success"
                      ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" />{t("backup_success")}</span>
                      : <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />{t("backup_failed")}</span>}
                  </TableCell>
                  <TableCell>{b.size_mb} MB</TableCell>
                  <TableCell>{b.duration_seconds}s</TableCell>
                  <TableCell>{new Date(b.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

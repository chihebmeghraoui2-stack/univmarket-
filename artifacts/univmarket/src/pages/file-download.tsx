import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function FileDownload() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/files/:token");
  const { toast } = useToast();

  const { data: fileInfo, isLoading, error } = useQuery({
    queryKey: ["/api/files", params?.token],
    queryFn: async () => {
      const res = await fetch(`/api/files/${params?.token}`);
      if (!res.ok) throw new Error(t("file_not_found"));
      return res.json();
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/files/${params?.token}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      if (!res.ok) throw new Error(t("download_failed"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileInfo.fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast({ title: t("download_started") }),
    onError: (e: any) => toast({ title: t("order_error"), description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (error || !fileInfo) return (
    <div className="flex items-center justify-center min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">{t("invalid_link")}</h2>
          <p className="text-muted-foreground">{t("link_expired_desc")}</p>
        </CardContent>
      </Card>
    </div>
  );

  const isExpired = new Date(fileInfo.expiresAt) < new Date();
  const downloadsLeft = fileInfo.maxDownloads - fileInfo.downloadCount;

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("secure_download")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="font-semibold">{fileInfo.fileName}</p>
            <p className="text-sm text-muted-foreground">
              {(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB · {fileInfo.mimeType}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-4 w-4" />{t("downloads_left")}
              </span>
              <Badge variant={downloadsLeft > 0 ? "default" : "destructive"}>
                {downloadsLeft} / {fileInfo.maxDownloads}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />{t("expires_on")}
              </span>
              <Badge variant={isExpired ? "destructive" : "secondary"}>
                {new Date(fileInfo.expiresAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {isExpired ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />{t("link_expired")}
            </div>
          ) : downloadsLeft <= 0 ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />{t("download_limit_reached")}
            </div>
          ) : (
            <Button className="w-full" onClick={() => downloadMutation.mutate()} disabled={downloadMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {downloadMutation.isPending ? t("downloading") : t("download_file")}
            </Button>
          )}

          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />{t("secure_transfer")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
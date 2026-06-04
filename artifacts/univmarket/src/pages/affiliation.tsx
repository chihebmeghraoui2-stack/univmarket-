import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function AffiliationPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();

  const { data: network } = useQuery({
    queryKey: ["/api/affiliations/my-network"],
    queryFn: async () => {
      const res = await fetch("/api/affiliations/my-network", {
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      return res.json();
    },
  });

  const { data: me } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("univmarket_token")}` },
      });
      return res.json();
    },
  });

  const referralLink = me?.referralCode
    ? `${window.location.origin}/register?ref=${me.referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: t("link_copied") });
  };

  const byLevel = [1, 2, 3].map(level => ({
    level,
    count: network?.network?.filter((n: any) => n.level === level).length || 0,
    rate: level === 1 ? "5%" : level === 2 ? "2%" : "1%",
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold">{t("affiliation_program")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> {t("my_referral_link")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input readOnly value={referralLink} className="flex-1 px-3 py-2 text-sm border rounded-lg bg-muted" />
            <Button onClick={copyLink} variant="outline">
              <Copy className="h-4 w-4 mr-1" /> {t("copy")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t("referral_desc")}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {byLevel.map(({ level, count, rate }) => (
          <Card key={level}>
            <CardContent className="pt-6 text-center space-y-2">
              <div className="text-3xl font-bold text-primary">{count}</div>
              <p className="font-semibold">{t("level")} {level}</p>
              <Badge variant="secondary">{t("commission")} {rate}</Badge>
              <p className="text-xs text-muted-foreground">
                {level === 1 ? t("direct_referrals") : level === 2 ? t("indirect_referrals") : t("level_3")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="font-semibold">{t("total_earned_affiliation")}</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{network?.totalEarned || 0} DZD</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("my_network")} ({network?.count || 0} {t("members")})</CardTitle>
        </CardHeader>
        <CardContent>
          {!network?.network?.length ? (
            <p className="text-muted-foreground text-sm text-center py-4">{t("no_referrals")}</p>
          ) : (
            <div className="space-y-2">
              {network.network.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{member.user?.name || t("user")}</p>
                    <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{t("level")} {member.level}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{member.commissionRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
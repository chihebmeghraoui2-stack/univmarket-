import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">404</h1>
          <p className="text-gray-600">{t("page_not_found")}</p>
          <Link href="/">
            <Button className="gradient-teal text-white border-none">{t("back_home")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
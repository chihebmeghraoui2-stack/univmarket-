import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Cookie, Shield, BarChart3, Target, ChevronDown, ChevronUp } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePreferences = { necessary: true, analytics: false, marketing: false };

export function getCookiePreferences(): CookiePreferences {
  try {
    const stored = localStorage.getItem("cookie-preferences");
    return stored ? JSON.parse(stored) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function hasCookieConsent(): boolean {
  return !!localStorage.getItem("cookie-consent-date");
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPrefs = getCookiePreferences();
    setPrefs(currentPrefs);
    if (!hasCookieConsent()) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const save = (preferences: CookiePreferences) => {
    localStorage.setItem("cookie-preferences", JSON.stringify(preferences));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    localStorage.setItem("cookie-consent", preferences.analytics ? "full" : "necessary");

    if (preferences.analytics) {
      localStorage.setItem("analytics-enabled", "true");
      trackEvent("cookie_consent", { analytics: true, marketing: preferences.marketing });
    }

    setVisible(false);
  };

  const acceptAll = () => {
    const all = { necessary: true, analytics: true, marketing: true };
    setPrefs(all);
    save(all);
  };

  const acceptNecessary = () => {
    save({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustom = () => save(prefs);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <Card className="max-w-2xl mx-auto shadow-2xl border-2">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Nous respectons votre vie privée</h3>
              <p className="text-xs text-muted-foreground">Conformément à la loi algérienne 18-05</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            UnivMarket utilise des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.
            Vous pouvez choisir quels cookies accepter.
          </p>

          {expanded && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Cookies nécessaires</p>
                    <p className="text-xs text-muted-foreground">Session, authentification, sécurité</p>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Cookies analytiques</p>
                    <p className="text-xs text-muted-foreground">Pages visitées, temps passé, performances</p>
                  </div>
                </div>
                <Switch checked={prefs.analytics} onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Cookies marketing</p>
                    <p className="text-xs text-muted-foreground">Recommandations personnalisées, préférences</p>
                  </div>
                </div>
                <Switch checked={prefs.marketing} onCheckedChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))} />
              </div>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Masquer les détails" : "Personnaliser mes préférences"}
          </button>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={acceptAll} className="flex-1 min-w-32">
              Tout accepter
            </Button>
            {expanded ? (
              <Button onClick={saveCustom} variant="outline" className="flex-1 min-w-32">
                Enregistrer mes choix
              </Button>
            ) : (
              <Button onClick={acceptNecessary} variant="outline" className="flex-1 min-w-32">
                Nécessaires uniquement
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            <a href="/mentions-legales" className="hover:underline text-primary">Politique de confidentialité</a>
            {" · "}
            Vous pouvez modifier vos préférences à tout moment dans les paramètres
          </p>
        </div>
      </Card>
    </div>
  );
}

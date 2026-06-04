import { ShieldOff, Mail, MessageCircle, Instagram, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function BannedPage() {
  const { t } = useTranslation();
  const rawReason = localStorage.getItem("banned_reason") || t("tos_violation");
  const reason = rawReason.replace(/^HTTP \d+ [^:]+:\s*/i, "").trim();

  const emailUrl = "https://mail.google.com/mail/?view=cm&to=chihebmeghraoui@gmail.com&su=Contestation+suspension+UnivMarket&body=" + encodeURIComponent(t("ban_email_body") + " " + reason);
  const whatsappUrl = "https://wa.me/213656247391?text=" + encodeURIComponent(t("ban_whatsapp_body") + " " + reason);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", padding: "2.5rem 2rem", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <ShieldOff style={{ width: 36, height: 36, color: "white" }} />
            </div>
            <h1 style={{ color: "white", fontSize: "1.875rem", fontWeight: 900, margin: "0 0 0.5rem" }}>{t("account_suspended")}</h1>
            <p style={{ color: "rgba(255,200,200,0.8)", fontSize: "0.875rem", margin: 0 }}>{t("access_blocked")}</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", padding: "1.5rem" }}>
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 16, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <AlertTriangle style={{ width: 18, height: 18, color: "#f87171", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ color: "#f87171", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>{t("suspension_reason")}</p>
                  <p style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>{reason}</p>
                </div>
              </div>
            </div>

            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center", marginBottom: "0.75rem" }}>{t("contest_suspension")}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { href: whatsappUrl, icon: MessageCircle, label: "WhatsApp", sub: "+213 656 247 391", color: "34,197,94" },
                { href: emailUrl, icon: Mail, label: "Gmail", sub: "chihebmeghraoui@gmail.com", color: "59,130,246" },
                { href: "https://instagram.com/chiheb_meg", icon: Instagram, label: "Instagram", sub: "@chiheb_meg", color: "236,72,153" },
              ].map(({ href, icon: Icon, label, sub, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.125rem", background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.35)`, borderRadius: 14, textDecoration: "none" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(${color},0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 20, height: 20, color: "white" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "white", fontWeight: 700, fontSize: "0.875rem", margin: 0 }}>{label}</p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", margin: 0 }}>{sub}</p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <Link href="/login">
            <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", margin: "0 auto" }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
              {t("back_to_login")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
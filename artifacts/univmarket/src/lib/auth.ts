import { useState, useCallback, useEffect } from "react";
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "client" | "seller" | "admin";
  wilaya_id: number;
  wilaya_name_fr?: string | null;
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  verified_at?: string | null;
  banned_at?: string | null;
  trust_score?: number | null;
  referral_code?: string | null;
  language_preference: string;
}
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("univmarket_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("univmarket_token");
  });

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("univmarket_token", newToken);
    localStorage.setItem("univmarket_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("univmarket_token");
    localStorage.removeItem("univmarket_user");
    setToken(null);
    setUser(null);
  }, []);

  // Verification silencieuse - jamais de deconnexion automatique
  // sauf : token expire (30j) ou compte banni
  useEffect(() => {
    if (!token || !user) return;
    const check = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/auth/me", {
          headers: { Authorization: "Bearer " + token }
        });
        // Erreur reseau ou serveur -> on ignore totalement, l utilisateur reste connecte
        if (!res.ok) {
          if (res.status === 401) {
            // Token expire en base de donnees (apres 30 jours)
            logout();
            window.location.href = "/login";
          }
          // 403, 500, etc -> on ignore
          return;
        }
        const data = await res.json();
        // Uniquement si le compte est banni
        if (data.banned_at || data.bannedAt) {
          logout();
          localStorage.setItem("banned_reason", data.banned_reason || data.bannedReason || "Violation des conditions.");
          window.location.href = "/banned";
        }
      } catch {
        // Erreur reseau -> on ignore, pas de deconnexion
      }
    };
    // Premier check apres 1 minute (pas au demarrage)
    const timeout = setTimeout(check, 60000);
    // Check toutes les 15 minutes comme les sites professionnels
    const interval = setInterval(check, 15 * 60 * 1000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [token]);

  const isAuthenticated = !!token && !!user;
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";
  return { user, token, login, logout, isAuthenticated, isSeller, isAdmin, isClient };
}
export function getAuthToken(): string | null {
  return localStorage.getItem("univmarket_token");
}



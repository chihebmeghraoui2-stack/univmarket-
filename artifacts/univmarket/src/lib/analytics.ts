// Systأ¨me analytics interne UnivMarket
// Stocke les أ©vأ©nements localement et les envoie au backend si analytics activأ©

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  page: string;
  userId?: string;
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  try {
    const analyticsEnabled = localStorage.getItem("analytics-enabled") === "true";
    if (!analyticsEnabled && event !== "cookie_consent") return;

    const user = localStorage.getItem("univmarket_user");
    const userId = user ? JSON.parse(user).id : undefined;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      userId,
    };

    const stored = JSON.parse(localStorage.getItem("analytics-events") || "[]");
    stored.push(analyticsEvent);
    if (stored.length > 100) stored.splice(0, stored.length - 100);
    localStorage.setItem("analytics-events", JSON.stringify(stored));

    const token = localStorage.getItem("univmarket_token");
    if (token) {
      fetch((import.meta.env.VITE_API_URL || "") + "/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(analyticsEvent),
      }).catch(() => {});
    }

    console.debug("[Analytics]", event, properties);
  } catch {}
}

export function trackPageView(page: string) {
  trackEvent("page_view", { page });
}

export function trackSearch(query: string, results: number) {
  trackEvent("search", { query, results });
}

export function trackServiceView(serviceId: number, title: string) {
  trackEvent("service_view", { serviceId, title });
}

export function trackOrderStart(serviceId: number, price: number) {
  trackEvent("order_start", { serviceId, price });
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem("analytics-events") || "[]");
  } catch {
    return [];
  }
}


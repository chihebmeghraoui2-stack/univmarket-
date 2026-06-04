import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

interface MessageItem {
  role: "user" | "assistant";
  text: string;
}

interface ChatWidgetProps {
  title?: string;
  subtitle?: string;
}

export default function ChatWidget({ title = "Assistant UnivMarket", subtitle = "" }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!open || !containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [history, open, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const nextHistory: MessageItem[] = [...history, { role: "user", text: trimmed }];
    setHistory(nextHistory);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: nextHistory, sellerId: user?.role === "seller" ? user?.id ?? null : null, userId: user?.id ?? null, userRole: user?.role ?? "client" }),
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { role: "assistant", text: data?.reply ?? "Je n'ai pas pu repondre." }]);
    } catch {
      setHistory((prev) => [...prev, { role: "assistant", text: "Erreur de connexion." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div style={{ width: 370, borderRadius: 20, overflow: "hidden", border: "0.5px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.13)", background: "white", fontFamily: "inherit" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#0F6E56,#1D9E75)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: "white", fontWeight: 600, fontSize: 15 }}>&#x635;&#x62F;&#x64A;&#x642;&#x643; &#x627;&#x644;&#x630;&#x643;&#x64A;</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>En ligne · Assistant UnivMarket</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={containerRef} style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10, height: 340, overflowY: "auto", background: "#f8fafb" }}>
            {history.length === 0 && (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 40 }}>
                <p style={{ margin: 0 }}>Bonjour {user?.name ?? ""} !</p>
                <p style={{ margin: "6px 0 0" }}>Comment puis-je vous aider ?</p>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                )}
                <div style={{ maxWidth: "75%", background: msg.role === "user" ? "linear-gradient(135deg,#0F6E56,#1D9E75)" : "white", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "9px 13px", border: msg.role === "assistant" ? "0.5px solid #e2e8f0" : "none" }}>
                  <p style={{ margin: 0, fontSize: 13.5, color: msg.role === "user" ? "white" : "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </div>
                <div style={{ background: "white", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", border: "0.5px solid #e2e8f0", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map((n) => (
                    <span key={n} style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", display: "inline-block", animation: `bounce 1s infinite ${n * 0.2}s` }}></span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px 13px", borderTop: "0.5px solid #e2e8f0", display: "flex", gap: 8, alignItems: "center", background: "white" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ecrivez un message..."
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
              style={{ flex: 1, height: 40, borderRadius: 24, border: "0.5px solid #e2e8f0", background: "#f8fafb", padding: "0 14px", fontSize: 13.5, outline: "none", fontFamily: "inherit" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ width: 40, height: 40, borderRadius: "50%", background: loading || !input.trim() ? "#9ca3af" : "linear-gradient(135deg,#0F6E56,#1D9E75)", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#0F6E56,#1D9E75)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(15,110,86,0.4)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

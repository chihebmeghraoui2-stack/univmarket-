import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/utils";
import { Bot, Send, User, Brain, AlertTriangle, X, Minimize2, Maximize2, RefreshCw, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Snapshot {
  snapshot_at: string;
  users: { total: number; sellers: number; clients: number; banned: number };
  orders: { total: number; completed: number; cancelled: number };
  services: { total: number; pending: number };
  disputes: { open: number };
  withdrawals: { pending: number };
}

interface Props {
  userId?: number;
  userName?: string;
  userRole?: string;
}

const QUICK = [
  { icon: "📊", label: "Résumé plateforme", q: "Donne-moi un résumé complet et analytique de la plateforme aujourd'hui avec toutes les métriques importantes." },
  { icon: "⚠️", label: "Activités suspectes", q: "Y a-t-il des activités suspectes ou anormales récentes ? Analyse les risques de fraude." },
  { icon: "🏆", label: "Top wilayas", q: "Quelles sont les wilayas les plus actives ? Analyse les performances géographiques." },
  { icon: "💸", label: "Retraits en attente", q: "Analyse les retraits en attente et donne-moi des recommandations de traitement." },
  { icon: "⚡", label: "Litiges ouverts", q: "Analyse les litiges ouverts et recommande des actions de résolution prioritaires." },
  { icon: "🎯", label: "Améliorations", q: "Recommande les 5 actions les plus importantes pour améliorer la plateforme maintenant." },
];

function renderMd(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\n/g, "<br/>");
}

export default function AdminAIAssistant({ userId, userName, userRole }: Props) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "🤖 Bonjour ! Je suis **ARIA** — votre assistante IA exclusive UnivMarket.\n\nJ'ai accès en **temps réel** à toutes les données de la plateforme : utilisateurs, commandes, services, litiges, retraits, wilayas et plus encore.\n\nChaque réponse est basée sur les données actuelles de votre base de données. Comment puis-je vous aider ?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("fr");
  const [liveMode, setLiveMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Snapshot en temps réel — refresh toutes les 30 secondes si liveMode
  const { data: snapshot, refetch: refetchSnapshot } = useQuery<Snapshot>({
    queryKey: ["aria-snapshot"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/ai-snapshot");
      if (!res.ok) throw new Error("snapshot failed");
      return res.json();
    },
    refetchInterval: liveMode ? 30000 : false,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      // Passer l'historique de conversation (6 derniers messages)
      const historyToSend = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await apiFetch("/api/admin/ai-assistant", {
        method: "POST",
        body: JSON.stringify({
          message,
          language,
          history: historyToSend,
          context: userId ? { userId, role: userRole } : undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur IA");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        timestamp: data.timestamp,
      }]);
      // Refresh snapshot après chaque réponse
      refetchSnapshot();
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Erreur de connexion à l'IA. Vérifiez votre connexion et la clé GROQ_API_KEY.",
        timestamp: new Date().toISOString(),
      }]);
    },
  });

  const send = (msg?: string) => {
    const text = msg || input.trim();
    if (!text || mutation.isPending) return;
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: new Date().toISOString() }]);
    setInput("");
    mutation.mutate(text);
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "🔄 Conversation réinitialisée. Je suis prêt avec les données fraîches de la plateforme !",
      timestamp: new Date().toISOString(),
    }]);
  };

  const alertCount = (snapshot?.disputes?.open ?? 0) + (snapshot?.withdrawals?.pending ?? 0) + (snapshot?.services?.pending ?? 0);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-200 flex items-center gap-2"
        >
          <Brain className="h-6 w-6" />
          <span className="text-sm font-semibold pr-1">ARIA IA</span>
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></span>
          {alertCount > 0 && (
            <span className="absolute -top-2 -left-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              {alertCount}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className={`fixed right-6 z-50 shadow-2xl rounded-2xl overflow-hidden border-2 border-purple-200 transition-all duration-300 ${minimized ? "bottom-6 w-80 h-14" : "bottom-6 w-[420px] h-[640px]"}`}
          style={{ display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5" />
              <div>
                <span className="font-bold text-sm">ARIA — Admin IA</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-white/70">
                    {liveMode ? "Live · " : ""}{snapshot ? `${snapshot.users.total} users · ${snapshot.orders.total} orders` : "Chargement..."}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLiveMode(!liveMode)}
                className={`p-1 rounded text-xs flex items-center gap-1 ${liveMode ? "text-green-300" : "text-white/50"}`}
                title={liveMode ? "Live activé" : "Live désactivé"}
              >
                <Zap className="h-3 w-3" />
              </button>
              <button onClick={() => refetchSnapshot()} className="text-white/70 hover:text-white p-1" title="Rafraîchir données">
                <RefreshCw className="h-3 w-3" />
              </button>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-16 h-7 text-xs bg-white/20 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 FR</SelectItem>
                  <SelectItem value="ar">🇩🇿 AR</SelectItem>
                  <SelectItem value="en">🇬🇧 EN</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => setMinimized(!minimized)} className="text-white hover:text-white/70 p-1">
                {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="text-white hover:text-white/70 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Alertes live */}
              {snapshot && (snapshot.disputes.open > 0 || snapshot.withdrawals.pending > 0 || snapshot.services.pending > 0) && (
                <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                  <span className="text-xs text-amber-700">
                    {snapshot.disputes.open > 0 && <span className="mr-2">⚠️ {snapshot.disputes.open} litiges ouverts</span>}
                    {snapshot.withdrawals.pending > 0 && <span className="mr-2">💸 {snapshot.withdrawals.pending} retraits en attente</span>}
                    {snapshot.services.pending > 0 && <span>📦 {snapshot.services.pending} services à valider</span>}
                  </span>
                </div>
              )}

              {/* Contexte utilisateur analysé */}
              {userId && (
                <div className="bg-purple-50 px-3 py-2 border-b flex items-center gap-2 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-700">Analyse : <strong>{userName}</strong> ({userRole})</span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50" style={{ minHeight: 0 }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-600" : "bg-gradient-to-r from-purple-600 to-blue-600"}`}>
                      {msg.role === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white shadow-sm rounded-tl-none border border-gray-100"}`}
                      dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
                    />
                  </div>
                ))}
                {mutation.isPending && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white shadow-sm rounded-2xl rounded-tl-none border border-gray-100 px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <span className="text-xs text-gray-400 mr-1">ARIA analyse...</span>
                        {[0,1,2].map(n => (
                          <span key={n} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${n*150}ms` }}></span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Questions rapides */}
              {messages.length <= 1 && (
                <div className="px-3 py-2 bg-white border-t border-gray-100 flex-shrink-0">
                  <p className="text-xs text-gray-400 mb-1.5">Questions rapides :</p>
                  <div className="grid grid-cols-2 gap-1">
                    {QUICK.slice(0, 4).map((q, i) => (
                      <button key={i} onClick={() => send(q.q)}
                        className="text-left text-xs bg-purple-50 text-purple-700 border border-purple-100 rounded-lg px-2 py-1.5 hover:bg-purple-100 transition-colors truncate">
                        {q.icon} {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <button onClick={clearChat} className="text-gray-300 hover:text-gray-500 p-1 flex-shrink-0" title="Nouvelle conversation">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="Posez votre question à ARIA..."
                    className="flex-1 text-sm h-9"
                    disabled={mutation.isPending}
                  />
                  <Button size="sm" onClick={() => send()} disabled={mutation.isPending || !input.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white h-9 px-3 flex-shrink-0">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-center text-xs text-gray-300 mt-1">
                  Données live · {snapshot ? new Date(snapshot.snapshot_at).toLocaleTimeString("fr-DZ") : "..."}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

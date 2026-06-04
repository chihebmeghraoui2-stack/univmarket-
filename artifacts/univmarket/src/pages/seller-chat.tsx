import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Search, MessageCircle, ArrowLeft, Users } from "lucide-react";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const API = "";

function similarity(a: string, b: string): number {
  a = a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  b = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (b.includes(a) || a.includes(b)) return 1;
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    if (b.includes(a[i])) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

export default function DirectChat() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  const roleLabel = user?.role === "admin" ? "utilisateurs" : user?.role === "seller" ? "clients" : "vendeurs";
  const roleTitle = user?.role === "admin" ? "Tous les" : user?.role === "seller" ? "Client" : "Vendeur";

  useEffect(() => {
    apiFetch("/api/direct-messages/contacts")
      .then(r => r.json())
      .then(data => { const arr = Array.isArray(data) ? data : data?.data ?? []; setContacts(arr); setFiltered(arr); })
      .catch(() => toast({ title: "Erreur chargement contacts", variant: "destructive" }));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(contacts); return; }
    const q = search.toLowerCase();
    const results = contacts
      .map(c => ({
        ...c,
        score: Math.max(
          similarity(q, c.name || ""),
          similarity(q, c.email || "")
        )
      }))
      .filter(c => c.score > 0.3)
      .sort((a, b) => b.score - a.score);
    setFiltered(results);
  }, [search, contacts]);

  const fetchMessages = async () => {
    if (!selected) return;
    const res = await apiFetch(`/api/direct-messages/${selected.id}`);
    if (res.ok) setMessages(await res.json());
  };

  useEffect(() => {
    if (!selected) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/direct-messages/${selected.id}`, {
        method: "POST",
        body: JSON.stringify({ body: input.trim() })
      });
      if (res.ok) { setInput(""); fetchMessages(); }
      else toast({ title: "Erreur envoi", variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-teal-600" />
        Messages  {roleTitle}s
        <span className="text-sm font-normal text-muted-foreground ml-2">
          Vous pouvez contacter uniquement les {roleLabel}
        </span>
      </h1>

      <div className="flex gap-0 h-[620px] border rounded-2xl overflow-hidden shadow-md">
        {/* LEFT */}
        <div className="w-80 border-r flex flex-col bg-slate-50 dark:bg-slate-900">
          <div className="p-3 border-b bg-white dark:bg-slate-800">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Users className="h-3 w-3" /> {contacts.length} {roleLabel}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Rechercher par nom ou email...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm rounded-xl"
              />
            </div>
            {search && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                {filtered.length} resultat{filtered.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-10 px-4">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Aucun {roleLabel.slice(0, -1)} trouve
              </div>
            )}
            {filtered.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelected(contact)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors ${selected?.id === contact.id ? "bg-teal-50 dark:bg-slate-800 border-r-2 border-teal-600" : ""}`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-sm">
                    {contact.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{contact.name}</p>
                    <span className={contact.role === "seller" ? "text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 bg-teal-100 text-teal-700" : contact.role === "admin" ? "text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 bg-purple-100 text-purple-700" : "text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 bg-blue-100 text-blue-700"}>
                      {contact.role === "seller" ? "Vendeur" : contact.role === "admin" ? "Admin" : "Client"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <MessageCircle className="h-16 w-16 mb-4 opacity-10" />
              <p className="font-semibold text-lg">Selectionnez un contact</p>
              <p className="text-sm mt-1">Choisissez un {roleLabel.slice(0,-1)} dans la liste pour commencer</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center gap-3 bg-white dark:bg-slate-900 shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSelected(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selected.avatar} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-sm">
                    {selected.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selected.name}</p>
                  <p className="text-xs text-teal-600">? Actualisation automatique toutes les 5s</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-10">
                    Aucun message  commencez la conversation !
                  </div>
                )}
                {messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender_id === user?.id
                        ? "bg-teal-700 text-white rounded-br-none"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700"
                    }`}>
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? "text-teal-200" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t bg-white dark:bg-slate-900 flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Votre message..."
                  className="flex-1 h-10 rounded-xl"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="bg-teal-700 hover:bg-teal-600 h-10 w-10 p-0 rounded-xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
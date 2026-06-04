import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, ArrowLeft, Package } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const API = import.meta.env.VITE_API_URL || "";

function useMessages(orderId: number | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!orderId || !user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("univmarket_token");
      const res = await fetch(`${API}/api/chat/messages/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  return { messages, loading, refetch: fetchMessages };
}

function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("univmarket_token");
        const res = await fetch(`${API}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setConversations(await res.json());
      } finally { setLoading(false); }
    };
    fetch_();
    const interval = setInterval(fetch_, 5000);
    return () => clearInterval(interval);
  }, []);

  return { conversations, loading };
}

export default function Chat() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/chat/:orderId");
  const orderId = params?.orderId ? Number(params.orderId) : null;
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(orderId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { conversations, loading: convsLoading } = useConversations();
  const { messages, loading: msgsLoading, refetch } = useMessages(selectedOrderId);

  useEffect(() => { if (orderId) setSelectedOrderId(orderId); }, [orderId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedOrderId || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem("univmarket_token");
      const res = await fetch(`${API}/api/chat/messages/${selectedOrderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: newMessage.trim() }),
      });
      if (res.ok) { setNewMessage(""); refetch(); }
      else toast({ title: t("order_error"), description: t("send_error"), variant: "destructive" });
    } finally { setSending(false); }
  };

  const selectedConv = conversations.find(c => c.orderId === selectedOrderId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("back")}</Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />{t("messages")}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        <Card className="md:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("conversations")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="p-3 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                {t("no_conversations")}
              </div>
            ) : conversations.map((conv) => (
              <button key={conv.orderId} onClick={() => setSelectedOrderId(conv.orderId)}
                className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0 ${selectedOrderId === conv.orderId ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {conv.otherUser?.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.otherUser?.name || "..."}</span>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full bg-primary">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage?.body || `${t("order_ref")} #${conv.orderId}`}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("order_ref")} #{conv.orderId}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedOrderId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t("select_conversation")}</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {selectedConv?.otherUser?.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{selectedConv?.otherUser?.name || "..."}</p>
                      <p className="text-xs text-muted-foreground">{t("order_ref")} #{selectedOrderId}</p>
                    </div>
                  </div>
                  <Link href={`/orders/${selectedOrderId}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />{t("view_order")}
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading && messages.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-12">
                    <div>
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">{t("start_conversation")}</p>
                    </div>
                  </div>
                ) : messages.map((msg: any) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && (
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-xs bg-muted">{msg.sender?.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                          {msg.body}
                          <div className={`text-xs mt-1 opacity-60 ${isMe ? "text-right" : "text-left"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={t("write_message")} className="flex-1" disabled={sending} />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{t("auto_update")}</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
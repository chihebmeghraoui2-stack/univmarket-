import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Package, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function ProductChat() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/product-chat/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = params?.id ? Number(params.id) : null;

  const { data, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ["productChat", chatId],
    queryFn: async () => {
      const res = await apiFetch("/api/product-chats/" + chatId + "/messages");
      if (!res.ok) throw new Error("Chat introuvable");
      return res.json();
    },
    enabled: Boolean(chatId),
    refetchInterval: 3000,
  });

  const serviceId = data?.chat?.serviceId;
  const { data: serviceData } = useQuery<any>({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const res = await apiFetch("/api/services/" + serviceId);
      if (!res.ok) throw new Error("Service introuvable");
      return res.json();
    },
    enabled: Boolean(serviceId),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/product-chats/" + chatId + "/messages", { method: "POST", body: JSON.stringify({ body: message }) });
      if (!res.ok) throw new Error("Envoi impossible");
      return res.json();
    },
    onSuccess: () => { setMessage(""); refetch(); },
    onError: () => toast({ title: "Erreur d envoi", variant: "destructive" }),
  });

  const validateMutation = useMutation({
    mutationFn: async () => { const res = await apiFetch("/api/product-chats/" + chatId + "/validate", { method: "POST" }); if (!res.ok) throw new Error(); return res.json(); },
    onSuccess: () => refetch(),
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const acceptMutation = useMutation({
    mutationFn: async () => { const res = await apiFetch("/api/product-chats/" + chatId + "/accept", { method: "POST" }); if (!res.ok) throw new Error(); return res.json(); },
    onSuccess: () => refetch(),
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const refuseMutation = useMutation({
    mutationFn: async () => { const res = await apiFetch("/api/product-chats/" + chatId + "/refuse", { method: "POST" }); if (!res.ok) throw new Error(); return res.json(); },
    onSuccess: () => refetch(),
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const chat = data?.chat;
  const serviceItem = serviceData ? { title: serviceData.title_fr, coverPhoto: serviceData.images?.[0] ?? null, price: serviceData.price } : null;
  const chatItem = chat?.serviceId ? (serviceItem ?? chat?.product) : chat?.product;
  const messages = data?.messages ?? [];
  const isArchived = chat?.clientRefused || chat?.sellerRefused || (chat?.clientValidated && chat?.sellerAccepted);
  const canSend = Boolean(chat && !isArchived && message.trim());

  const getStatus = () => {
    if (chat?.clientRefused || chat?.sellerRefused) return { label: "Refusee", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle };
    if (chat?.clientValidated && chat?.sellerAccepted) return { label: "Confirmee", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
    return { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
  };

  const status = chat ? getStatus() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <Link href={chat?.serviceId ? "/services" : "/products"}>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 mb-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {chat?.serviceId ? "Retour aux services" : "Retour aux produits"}
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Discussion {chat?.serviceId ? "Service" : "Produit"}</h1>
              <p className="text-sm text-slate-500">Communication securisee UnivMarket</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        ) : isError || !chat ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            <XCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
            <p className="font-semibold">Discussion introuvable</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Service/Produit Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {chatItem?.coverPhoto ? (
                    <img src={chatItem.coverPhoto} alt={chatItem?.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-slate-400" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{chat?.serviceId ? "Service" : "Produit"}</p>
                  <p className="font-bold text-slate-900 truncate">{chatItem?.title ?? "Produit supprime"}</p>
                  <p className="text-teal-600 font-semibold text-sm mt-0.5">{chatItem?.price ? Number(chatItem.price).toLocaleString() : "-"} DZD</p>
                </div>
                {status && (
                  <div className={"flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold " + status.color}>
                    <status.icon className="h-3.5 w-3.5" />
                    {status.label}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-bold">{chatItem?.title?.charAt(0)?.toUpperCase() ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{chatItem?.title ?? "Discussion"}</p>
                    <p className="text-xs text-slate-400">Chat #{chat.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Securise
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Aucun message pour l instant.</p>
                    <p className="text-xs mt-1">Commencez la discussion !</p>
                  </div>
                ) : messages.map((msg: any) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <Avatar className="h-7 w-7 mr-2 shrink-0 mt-1">
                          <AvatarFallback className="text-xs bg-slate-200 text-slate-600">{msg.sender?.name?.charAt(0)?.toUpperCase() ?? "?"}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={"max-w-[70%]"}>
                        <div className={"px-4 py-2.5 rounded-2xl text-sm " + (isMe ? "bg-teal-600 text-white rounded-br-sm" : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm shadow-sm")}>
                          {msg.body}
                        </div>
                        <p className={"text-[10px] mt-1 text-slate-400 " + (isMe ? "text-right" : "text-left")}>
                          {msg.sender?.name} آ· {new Date(msg.createdAt).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Actions */}
              {!isArchived && (
                <div className="px-5 py-3 border-t border-slate-100 bg-white">
                  {user?.role === "client" && !chat.clientValidated && !chat.clientRefused && !chat.sellerRefused && (
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" onClick={() => validateMutation.mutate()} disabled={validateMutation.isLoading} className="bg-green-600 hover:bg-green-700 text-white gap-1.5 flex-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Valider la commande
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => refuseMutation.mutate()} disabled={refuseMutation.isLoading} className="gap-1.5 flex-1">
                        <XCircle className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    </div>
                  )}
                  {user?.role === "seller" && !chat.sellerAccepted && !chat.sellerRefused && !chat.clientRefused && (
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isLoading} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 flex-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Accepter la commande
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => refuseMutation.mutate()} disabled={refuseMutation.isLoading} className="gap-1.5 flex-1">
                        <XCircle className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="px-5 py-4 border-t border-slate-100 bg-white">
                {isArchived ? (
                  <div className="text-center text-sm text-slate-400 py-2">Cette discussion est archivee.</div>
                ) : (
                  <div className="flex gap-3 items-center">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) sendMutation.mutate(); } }}
                      placeholder="Ecrire un message..."
                      disabled={sendMutation.isLoading}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    />
                    <Button
                      onClick={() => sendMutation.mutate()}
                      disabled={!canSend || sendMutation.isLoading}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 w-10 p-0 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





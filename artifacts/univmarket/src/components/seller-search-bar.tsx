import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Shield } from "lucide-react";

export default function SellerSearchBar() {
  const [q, setQ] = useState("");
  const [, navigate] = useLocation();

  const { data: sellers } = useQuery({
    queryKey: ["/api/sellers/search", q],
    queryFn: async () => {
      if (q.length < 2) return [];
      const res = await fetch(`/api/sellers/search?q=${encodeURIComponent(q)}`);
      return res.json();
    },
    enabled: q.length >= 2,
  });

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Chercher un vendeur par nom ou email..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      {q.length >= 2 && sellers && sellers.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {sellers.map((seller: any) => (
            <button
              key={seller.id}
              onClick={() => { navigate(`/seller/${seller.id}`); setQ(""); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {seller.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{seller.name}</p>
                  {seller.verified && (
                    <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0 gap-1">
                      <Shield className="h-2 w-2" />
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{seller.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {q.length >= 2 && sellers?.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-xl shadow-lg p-4 text-center text-sm text-muted-foreground">
          Aucun vendeur trouve pour "{q}"
        </div>
      )}
    </div>
  );
}

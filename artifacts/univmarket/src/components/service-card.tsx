import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, CheckCircle, MapPin } from "lucide-react";

interface ServiceCardProps {
  id: number;
  title_fr: string;
  price: number;
  price_type: string;
  delivery_days: number;
  seller_name: string;
  seller_avatar?: string | null;
  seller_verified?: boolean;
  seller_trust_score?: number | null;
  wilaya_name_fr: string;
  category_name_fr?: string | null;
  images?: string[];
  avg_rating?: number | null;
  reviews_count?: number;
  is_featured?: boolean;
  views_count?: number;
}

export default function ServiceCard({
  id, title_fr, price, price_type, delivery_days, seller_name, seller_avatar,
  seller_verified, wilaya_name_fr, category_name_fr, images, avg_rating, reviews_count, is_featured,
}: ServiceCardProps) {
  const priceLabel = price_type === "negotiable" ? "Négociable" : `${price.toLocaleString("fr-DZ")} DZD`;
  const pricePrefix = price_type === "hourly" ? "/h" : "";
  const imgUrl = images?.[0] ?? `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=240&fit=crop&auto=format&q=80`;

  return (
    <Link href={`/services/${id}`} data-testid={`card-service-${id}`}>
      <Card className="group overflow-hidden card-hover cursor-pointer border-border/60 bg-card h-full">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[16/9] bg-muted">
          <img
            src={imgUrl}
            alt={title_fr}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {is_featured && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-semibold shadow-sm">
              En vedette
            </Badge>
          )}
          {category_name_fr && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs opacity-90">
              {category_name_fr}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {title_fr}
          </h3>

          {/* Seller */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={seller_avatar ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                {seller_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs text-muted-foreground truncate">{seller_name}</span>
              {seller_verified && <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />}
            </div>
          </div>

          {/* Wilaya + rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{wilaya_name_fr}</span>
            </div>
            {avg_rating && avg_rating > 0 ? (
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{avg_rating.toFixed(1)}</span>
                {reviews_count ? <span className="text-muted-foreground">({reviews_count})</span> : null}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{delivery_days}j</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-sm text-primary">{priceLabel}</span>
              {pricePrefix && <span className="text-xs text-muted-foreground">{pricePrefix}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

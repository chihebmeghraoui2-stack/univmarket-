import { Badge } from "@/components/ui/badge";

interface TrustScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function TrustScoreBadge({ score, showLabel = true, showScore = true, size = "md" }: TrustScoreBadgeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  let tone = "bg-slate-100 text-slate-800";
  let label = "Non classé";

  if (normalizedScore >= 85) {
    tone = "bg-amber-100 text-amber-900";
    label = "Vendeur d'Excellence";
  } else if (normalizedScore >= 70) {
    tone = "bg-slate-100 text-slate-900";
    label = "Vendeur Fiable";
  } else if (normalizedScore >= 50) {
    tone = "bg-orange-100 text-orange-900";
    label = "Vendeur Actif";
  }

  const sizeClasses = size === "sm" ? "px-2 py-1 text-xs" : size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm";

  return (
    <Badge className={`${tone} ${sizeClasses} inline-flex items-center gap-2 rounded-full`}>
      {showScore ? <span className="font-semibold">{normalizedScore}%</span> : null}
      {showLabel ? <span>{label}</span> : null}
    </Badge>
  );
}

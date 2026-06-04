import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye, Tag, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BlogDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;
  const [, navigate] = useLocation();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug missing");
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-96 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );

  if (isError || !post) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      <h2 className="text-xl font-semibold mb-4">{t("article_not_found")}</h2>
      <Button onClick={() => navigate("/blog")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />{t("back_to_blog")}
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/blog")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{t("back_to_blog")}
        </Button>

        {post.coverImage && (
          <img src={post.coverImage} alt={post.titleFr} className="w-full h-80 object-cover rounded-lg" />
        )}

        <div className="space-y-3">
          <h1 className="text-4xl font-bold">{post.titleFr}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />{post.views || 0} {t("views_count")}
            </span>
            {post.author_name && <span>{t("by_seller")} {post.author_name}</span>}
          </div>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="px-0 py-6">
          {post.excerpt && (
            <p className="text-lg text-muted-foreground font-medium mb-6 italic border-l-4 border-primary pl-4">
              {post.excerpt}
            </p>
          )}
          <div className="text-base leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: post.contentFr }} />
        </CardContent>
      </Card>

      <div className="border-t pt-8">
        <Button onClick={() => navigate("/blog")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />{t("see_all_articles")}
        </Button>
      </div>
    </div>
  );
}
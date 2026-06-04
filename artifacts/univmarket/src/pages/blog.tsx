import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function BlogPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, navigate] = useLocation();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/blog");
      return res.json();
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold">{t("blog_title")}</h1>
      {!posts?.length ? (
        <p className="text-muted-foreground text-center py-12">{t("no_posts")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post: any) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/blog/${post.slugFr}`)}>
              {post.coverImage && (
                <img src={post.coverImage} alt={post.titleFr} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <CardHeader>
                <h2 className="font-bold text-lg line-clamp-2">{post.titleFr}</h2>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {post.views || 0} {t("views_count")}
                  </span>
                </div>
                {post.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {post.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

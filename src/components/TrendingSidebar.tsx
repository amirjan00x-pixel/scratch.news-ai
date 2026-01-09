import { Article } from "@/services/newsService";
import { NewsImage } from "./NewsImage";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { TrendingUp, Flame, Clock } from "lucide-react";
import { getCategoryColor } from "@/constants/categoryColors";

interface TrendingSidebarProps {
  trending: Article[];
  categories: string[];
  title?: string;
  showMustWatch?: boolean;
}

export const TrendingSidebar = ({
  trending,
  categories,
  title = "Trending Now",
  showMustWatch = true
}: TrendingSidebarProps) => {
  return (
    <aside className="flex flex-col gap-6">
      {/* Trending Section */}
      <div className="rounded-2xl border border-border/50 bg-white dark:bg-slate-900 p-5 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
          </div>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="space-y-3">
          {trending.slice(0, 6).map((article, index) => {
            const colors = getCategoryColor(article.category);
            return (
              <Link
                key={article.id}
                to={`/news/${article.id}`}
                className="group flex items-start gap-3 rounded-xl p-2 -mx-2 transition-all duration-200 hover:bg-muted/50"
              >
                {/* Large gradient number */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${index < 3 ? 'from-primary to-primary/60' : 'from-muted to-muted/80'} flex items-center justify-center shadow-sm`}>
                  <span className={`text-lg font-bold ${index < 3 ? 'text-white' : 'text-muted-foreground'}`}>
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold uppercase ${colors.text}`}>
                      {article.category}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Must Watch Section */}
      {showMustWatch && trending.length > 6 && (
        <div className="rounded-2xl border border-border/50 bg-white dark:bg-slate-900 p-5 shadow-lg shadow-black/5">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Must Read</h3>
          </div>

          <div className="space-y-4">
            {trending.slice(6, 9).map((article) => {
              const colors = getCategoryColor(article.category);
              return (
                <Link
                  key={article.id}
                  to={`/news/${article.id}`}
                  className="group block rounded-xl overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <NewsImage
                      src={article.image_url || ""}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${colors.bg} ${colors.text} backdrop-blur-sm`}>
                      {article.category}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Cloud */}
      {showMustWatch && categories.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-white dark:bg-slate-900 p-5 shadow-lg shadow-black/5">
          <h3 className="text-lg font-bold text-foreground mb-4">Explore Topics</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const colors = getCategoryColor(category);
              return (
                <button
                  key={category}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${colors.bg} ${colors.text} ${colors.hover} border ${colors.border}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

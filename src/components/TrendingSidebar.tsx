import { Article } from "@/services/newsService";
import { NewsImage } from "./NewsImage";
import { formatDistanceToNow } from "date-fns";

interface TrendingSidebarProps {
  trending: Article[];
  categories: string[];
}

export const TrendingSidebar = ({ trending, categories }: TrendingSidebarProps) => {
  return (
    <aside className="flex flex-col gap-10">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-glass">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Trending Now</h3>
          <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Live</span>
        </div>
        <div className="mt-4 space-y-4">
          {trending.slice(0, 6).map((article, index) => (
            <a
              key={article.id}
              href={article.source_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid grid-cols-[48px_1fr] gap-3 rounded-2xl border border-transparent p-2 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {index + 1}
              </div>
              <div>
                <h4 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
                  {article.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-glass">
        <h3 className="text-xl font-semibold text-foreground">Must Watch</h3>
        <div className="mt-4 space-y-4">
          {trending.slice(6, 9).map((article) => (
            <a
              key={article.id}
              href={article.source_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-border p-3 transition hover:border-primary/40"
            >
              <div className="overflow-hidden rounded-xl">
                <NewsImage
                  src={article.image_url || ""}
                  alt={article.title}
                  className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground line-clamp-2">{article.title}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-glass">
        <h3 className="text-xl font-semibold text-foreground">Category Cloud</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              className="rounded-full border border-primary/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:bg-primary hover:text-white"
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

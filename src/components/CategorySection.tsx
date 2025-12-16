import { Article } from "@/services/newsService";
import { NewsImage } from "./NewsImage";
import { format } from "date-fns";
import { Bookmark } from "lucide-react";

interface CategorySectionProps {
  title: string;
  articles: Article[];
}

export const CategorySection = ({ title, articles }: CategorySectionProps) => {
  if (!articles?.length) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">Category</p>
            <h3 className="text-3xl font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <button className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground">
          View All →
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.source_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-[22px] border border-border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            style={{ minHeight: 420 }}
          >
            <div className="relative overflow-hidden rounded-[18px]">
              <NewsImage
                src={article.image_url || ""}
                alt={article.title}
                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {article.category}
              </span>
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {format(new Date(article.published_at), "MMM d, yyyy")}
              </p>
              <h4 className="mt-2 text-2xl font-semibold leading-tight text-foreground line-clamp-2">
                {article.title}
              </h4>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground line-clamp-2">
                {article.summary}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{article.source}</span>
                <Bookmark className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

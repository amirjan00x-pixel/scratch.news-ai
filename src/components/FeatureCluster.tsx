import { Article } from "@/services/newsService";
import { NewsImage } from "./NewsImage";
import { format } from "date-fns";
import { Link } from "react-router-dom"; // Add import

interface FeatureClusterProps {
  feature?: Article;
  highlights: Article[];
}

export const FeatureCluster = ({ feature, highlights }: FeatureClusterProps) => {
  if (!feature) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1 rounded-full bg-primary" />
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-muted-foreground">Curated</p>
            <h2 className="text-3xl font-semibold text-foreground">Editor's Radar</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", "Trending", "Deep Dives", "Briefings"].map((chip) => (
            <button
              key={chip}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Link
          to={`/news/${feature.id}`}
          className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-slate-900 text-white shadow-glass-lg lg:col-span-2"
        >
          <div className="absolute inset-0">
            <NewsImage
              src={feature.image_url || ""}
              alt={feature.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/40 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-end space-y-4 p-10">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                Exclusive
              </span>
              <span className="text-xs uppercase tracking-[0.3em] text-white/70">
                {format(new Date(feature.published_at), "MMM d, yyyy")}
              </span>
            </div>
            <h3 className="text-3xl font-semibold leading-snug">{feature.title}</h3>
            <p className="text-lg text-white/80">{feature.summary}</p>
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-white/70">
              <span>{feature.source}</span>
              <span className="h-px w-10 bg-white/30" />
              <span>Read More →</span>
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-4">
          {highlights.slice(0, 3).map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.id}`}
              className="group grid grid-cols-[100px_1fr] gap-4 rounded-2xl border border-border bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="overflow-hidden rounded-xl border border-accent/30">
                <NewsImage
                  src={article.image_url || ""}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                  Spotlight
                </span>
                <h4 className="text-lg font-semibold text-foreground line-clamp-2">
                  {article.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

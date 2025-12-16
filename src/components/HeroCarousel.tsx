import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Article } from "@/services/newsService";
import { NewsImage } from "./NewsImage";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface HeroCarouselProps {
  heroArticles: Article[];
  spotlightArticles: Article[];
}

const estimateReadTime = (text?: string) => {
  if (!text) return "4 min read";
  const words = text.split(/\s+/).length;
  const minutes = Math.max(3, Math.round(words / 180));
  return `${minutes} min read`;
};

export const HeroCarousel = ({ heroArticles, spotlightArticles }: HeroCarouselProps) => {
  const [index, setIndex] = useState(0);
  const slides = useMemo(() => heroArticles.slice(0, 4), [heroArticles]);
  const hero = slides[index];

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!hero) return null;

  const goTo = (next: number) => {
    if (!slides.length) return;
    setIndex((next + slides.length) % slides.length);
  };

  return (
    <section className="grid min-h-[540px] gap-10 lg:grid-cols-[2fr_1fr]">
      <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-[#081B3A] text-white shadow-glass-lg">
        <div className="absolute inset-0">
          <NewsImage
            src={hero.image_url || ""}
            alt={hero.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#081B3A] via-[#040D1F]/80 to-[#040D1F]/40" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-end p-10 lg:p-14">
          <span className="mb-3 inline-flex items-center rounded-full bg-primary/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
            {hero.category || "AI Insight"}
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-white lg:text-[54px] lg:leading-[60px]">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
            {hero.summary}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.2em] text-white/70">
            <span>{format(new Date(hero.published_at), "MMM d, yyyy")}</span>
            <span className="h-px w-12 bg-white/30" />
            <span>{estimateReadTime(hero.summary)}</span>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <a
              href={hero.source_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em]"
            >
              <span className="relative z-10">Read More</span>
              <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-[hsl(var(--neon-cyan))] transition-all duration-300 group-hover:w-full" />
            </a>
            <p className="text-xs text-white/60">{hero.source}</p>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-y-0 flex items-center justify-between px-6">
            <button
              onClick={() => goTo(index - 1)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Previous story"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(index + 1)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Next story"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {spotlightArticles.slice(0, 3).map((article) => (
          <a
            key={article.id}
            href={article.source_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-[165px] items-center gap-4 rounded-2xl border border-[#DEE5F0] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="h-full w-[32%] overflow-hidden rounded-xl">
              <NewsImage
                src={article.image_url || ""}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {article.category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground line-clamp-2">
                {article.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {format(new Date(article.published_at), "MMM d, yyyy")} • {article.source}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

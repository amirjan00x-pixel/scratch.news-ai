import { Link } from "react-router-dom";
import { Clock, Bookmark } from "lucide-react";
import { ShareButtons } from "./ShareButtons";
import { NewsImage } from "./NewsImage";
import { getCategoryColor } from "@/constants/categoryColors";
import { useState, useEffect } from "react";

interface NewsCardProps {
  id: string;
  title: string;
  summary: string;
  category: string;
  timeAgo: string;
  image: string;
  source?: string;
  sourceUrl?: string;
  featured?: boolean; // New prop for featured/large cards
}

// Reading time helper
const calculateReadingTime = (text: string): number => {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

// Bookmark helpers
const isBookmarked = (id: string): boolean => {
  try {
    const bookmarks = JSON.parse(localStorage.getItem("ai-nexus-bookmarks") || "[]");
    return bookmarks.includes(id);
  } catch {
    return false;
  }
};

export const NewsCard = ({
  id,
  title,
  summary,
  category,
  timeAgo,
  image,
  source,
  sourceUrl,
  featured = false,
}: NewsCardProps) => {
  const colors = getCategoryColor(category);
  const readingTime = calculateReadingTime(summary);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(id));
  }, [id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const bookmarks = JSON.parse(localStorage.getItem("ai-nexus-bookmarks") || "[]");
      const newBookmarks = bookmarked
        ? bookmarks.filter((b: string) => b !== id)
        : [...bookmarks, id];
      localStorage.setItem("ai-nexus-bookmarks", JSON.stringify(newBookmarks));
      setBookmarked(!bookmarked);
    } catch {
      // Silently fail
    }
  };

  // Featured card layout (large)
  if (featured) {
    return (
      <Link
        to={`/news/${id}`}
        className="group relative block overflow-hidden rounded-3xl border border-border/50 bg-white dark:bg-slate-900 shadow-lg shadow-black/5 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1"
      >
        <div className="aspect-[16/9] overflow-hidden">
          <NewsImage
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} backdrop-blur-sm`}>
              {category}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/80">
              <Clock className="h-3 w-3" />
              {readingTime} min
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-foreground transition-colors">
            {title}
          </h3>
          <p className="text-sm text-white/70 line-clamp-2 mb-3">{summary}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">{timeAgo}</span>
            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
              <button
                onClick={toggleBookmark}
                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className={`p-2 rounded-full transition-all ${bookmarked ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
              <ShareButtons title={title} url={`${window.location.origin}/news/${id}`} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Standard card layout
  return (
    <Link
      to={`/news/${id}`}
      className="group block rounded-2xl border border-border/50 bg-white dark:bg-slate-900 p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div className="flex gap-4">
        <div className="w-28 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted relative">
          <NewsImage src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          {/* Category badge on image */}
          <span className={`absolute top-1.5 left-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text} backdrop-blur-sm`}>
            {category}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-sm font-bold mb-1.5 line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-snug">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-auto">{summary}</p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime} min
              </span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
              <button
                onClick={toggleBookmark}
                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className={`p-1.5 rounded-full transition-all ${bookmarked ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
              <ShareButtons title={title} url={`${window.location.origin}/news/${id}`} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

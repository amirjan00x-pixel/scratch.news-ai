import { Link } from "react-router-dom";
import { Clock, ExternalLink } from "lucide-react";
import { ShareButtons } from "./ShareButtons";
import { NewsImage } from "./NewsImage";

interface NewsCardProps {
  id: string; // Added id prop
  title: string;
  summary: string;
  category: string;
  timeAgo: string;
  image: string;
  source?: string;
  sourceUrl?: string;
}

export const NewsCard = ({
  id,
  title,
  summary,
  category,
  timeAgo,
  image,
  source,
  sourceUrl,
}: NewsCardProps) => {
  const content = (
    <div className="flex gap-3">
      {image && (
        <div className="w-24 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
          <NewsImage src={image} alt={title} className="w-full h-full" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
            {category}
          </span>
          {source && (
            <>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground">{source}</span>
            </>
          )}
        </div>
        <h3 className="text-sm font-bold mb-1 line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
          {title}
          {sourceUrl && (
            <ExternalLink className="h-2.5 w-2.5 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </h3>
        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{summary}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>{timeAgo}</span>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <ShareButtons title={title} url={`${window.location.origin}/news/${id}`} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Link to={`/news/${id}`} className="group cursor-pointer block">
      {content}
    </Link>
  );
};

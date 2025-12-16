import { Clock } from "lucide-react";
import { ShareButtons } from "./ShareButtons";
import { NewsImage } from "./NewsImage";

interface CompactNewsCardProps {
  title: string;
  category: string;
  timeAgo: string;
  image: string;
  sourceUrl?: string;
}

export const CompactNewsCard = ({
  title,
  category,
  timeAgo,
  image,
  sourceUrl,
}: CompactNewsCardProps) => {
  return (
    <a 
      href={sourceUrl || "#"} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group cursor-pointer block"
    >
      <div className="rounded overflow-hidden mb-2">
        <NewsImage
          src={image}
          alt={title}
          className="w-full h-24"
        />
      </div>
      
      <span className="text-[9px] font-bold text-primary uppercase tracking-wide">
        {category}
      </span>
      <h3 className="text-xs font-bold mt-1 line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          <span>{timeAgo}</span>
        </div>
        <div onClick={(e) => e.preventDefault()}>
          <ShareButtons title={title} url={sourceUrl || window.location.href} />
        </div>
      </div>
    </a>
  );
};

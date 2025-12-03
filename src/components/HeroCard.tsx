import { Clock, Bookmark, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeroCardProps {
  title: string;
  summary: string;
  category: string;
  timeAgo: string;
  image: string;
  live?: boolean;
}

export const HeroCard = ({
  title,
  summary,
  category,
  timeAgo,
  image,
  live,
}: HeroCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-card border border-border shadow-glass-lg group cursor-pointer">
      <div className="aspect-[16/9] md:aspect-[21/9] relative overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute top-4 left-4 flex gap-2">
          {live && (
            <Badge className="bg-destructive text-destructive-foreground border-0 font-semibold">
              LIVE
            </Badge>
          )}
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground border-0">
            {category}
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 line-clamp-2">
            {title}
          </h2>
          <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2 max-w-3xl">
            {summary}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock className="h-4 w-4" />
              <span>{timeAgo}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

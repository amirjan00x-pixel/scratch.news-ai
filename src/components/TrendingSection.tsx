import { TrendingUp, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";

const trendingTopics = [
  { topic: "GPT-5", mentions: 1247 },
  { topic: "OpenAI", mentions: 892 },
  { topic: "Claude 4", mentions: 745 },
  { topic: "Gemini", mentions: 623 },
  { topic: "DeepSeek", mentions: 521 },
];

export const TrendingSection = () => {
  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Trending Topics</h2>
      </div>
      
      <div className="space-y-3">
        {trendingTopics.map((item, index) => (
          <button
            key={item.topic}
            className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                  {item.topic}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{item.mentions.toLocaleString()} mentions</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};

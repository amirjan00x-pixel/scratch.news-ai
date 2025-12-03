import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Footer } from "@/components/Footer";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export default function AIHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["ai-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_history")
        .select("*")
        .order("year", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BreakingNewsTicker />
      <CategoryNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">History of Artificial Intelligence</h1>
          <p className="text-lg text-muted-foreground mb-12">
            A timeline of key milestones in the development of artificial intelligence
          </p>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-20 mb-3"></div>
                  <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-0.5 h-full bg-border"></div>
              
              <div className="space-y-8">
                {history?.map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className={`w-full md:w-5/12 ${index % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}>
                      <Card className="p-6 shadow-glass hover:shadow-glass-lg transition-shadow">
                        <div className="text-sm font-bold text-primary mb-2">{item.year}</div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </Card>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
                    
                    <div className="hidden md:block w-5/12"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

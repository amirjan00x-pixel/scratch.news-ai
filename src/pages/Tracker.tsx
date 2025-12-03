import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tracker = () => {
  const { data: updates, isLoading } = useQuery({
    queryKey: ["ai-tracker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_tracker")
        .select("*")
        .order("change_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "version": return "bg-blue-500";
      case "api": return "bg-green-500";
      case "pricing": return "bg-orange-500";
      case "feature": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const filterByCategory = (category?: string) => {
    if (!updates) return [];
    if (!category) return updates;
    return updates.filter(update => update.category === category);
  };

  const renderUpdates = (filteredUpdates: typeof updates) => (
    <div className="space-y-3">
      {filteredUpdates && filteredUpdates.length > 0 ? (
        filteredUpdates.map((update) => (
          <Card key={update.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getCategoryColor(update.category)} text-white text-xs`}>
                      {update.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(update.change_date), { addSuffix: true })}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{update.title}</CardTitle>
                </div>
                {update.source_url && (
                  <a
                    href={update.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm">{update.description}</CardDescription>
              {update.source && (
                <p className="text-xs text-muted-foreground mt-2">Source: {update.source}</p>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No updates found in this category
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <BreakingNewsTicker />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">AI Tracker</h1>
            <p className="text-sm text-muted-foreground">Track GPT versions, API changes, pricing updates, and feature releases</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="version">Versions</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="feature">Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {renderUpdates(updates)}
              </TabsContent>
              
              <TabsContent value="version">
                {renderUpdates(filterByCategory("version"))}
              </TabsContent>
              
              <TabsContent value="api">
                {renderUpdates(filterByCategory("api"))}
              </TabsContent>
              
              <TabsContent value="pricing">
                {renderUpdates(filterByCategory("pricing"))}
              </TabsContent>
              
              <TabsContent value="feature">
                {renderUpdates(filterByCategory("feature"))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tracker;

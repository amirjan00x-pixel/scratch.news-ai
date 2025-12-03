import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Admin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleFetchNews = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/fetch-news', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Success!",
                    description: data.message || "News articles fetched successfully",
                });
            } else {
                throw new Error(data.error || "Failed to fetch news");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch news",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">News Management</h2>
                    <p className="text-muted-foreground mb-4">
                        Click the button below to manually fetch the latest AI news from RSS feeds.
                    </p>

                    <Button
                        onClick={handleFetchNews}
                        disabled={isLoading}
                        size="lg"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Fetching News..." : "Fetch Latest News"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Admin;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/context/AdminAuthContext";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const logClientError = (context: string, err: unknown) => {
    const error = err as { message?: string; status?: number; response?: { data?: unknown } };
    console.error(context, {
        message: error?.message ?? String(err ?? "Unknown error"),
        status: error?.status,
        responseData: error?.response?.data,
    });
};

const Admin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [adminKeyInput, setAdminKeyInput] = useState("");
    const { toast } = useToast();
    const { isAdmin, adminKey, login, logout, isAuthenticating, authError } = useAdminAuth();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        const success = await login(adminKeyInput.trim());
        if (success) {
            setAdminKeyInput("");
            toast({
                title: "Admin authenticated",
                description: "You now have access to admin actions.",
            });
        }
    };

    const handleFetchNews = async () => {
        if (!adminKey) {
            toast({
                title: "Authentication required",
                description: "Please authenticate with your admin key first.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/fetch-news`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": adminKey,
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Fetch started",
                    description: data.message || "News articles fetched successfully",
                });
            } else {
                throw new Error(data.error || "Failed to fetch news");
            }
        } catch (error) {
            logClientError("Fetch news failed", error);
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
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <p className="text-muted-foreground text-sm">
                            Restricted tools for internal operators.
                        </p>
                    </div>
                    {isAdmin && (
                        <Button variant="outline" onClick={logout}>
                            Log out
                        </Button>
                    )}
                </div>

                {!isAdmin ? (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-2">Authenticate</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Enter the secure admin API key provided by the engineering team. Never share it publicly.
                        </p>
                        <form className="space-y-4" onSubmit={handleLogin}>
                            <Input
                                type="password"
                                placeholder="Admin API key"
                                value={adminKeyInput}
                                onChange={(event) => setAdminKeyInput(event.target.value)}
                            />
                            {authError && (
                                <p className="text-sm text-destructive">
                                    {authError}
                                </p>
                            )}
                            <Button type="submit" disabled={isAuthenticating}>
                                {isAuthenticating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isAuthenticating ? "Verifying..." : "Unlock Admin Tools"}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">News Management</h2>
                        <p className="text-muted-foreground mb-4">
                            Trigger an immediate fetch of vetted RSS sources. Requests are authenticated and rate limited.
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
                )}
            </div>
        </div>
    );
};

export default Admin;

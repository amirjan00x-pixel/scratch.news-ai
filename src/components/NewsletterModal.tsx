import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, X } from "lucide-react";
import { z } from "zod";

interface NewsletterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .toLowerCase(),
});

export const NewsletterModal = ({ open, onOpenChange }: NewsletterModalProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({
        title: "Invalid Email",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Successfully subscribed!",
        description: "You'll receive the latest AI news in your inbox weekly",
      });
      setEmail("");
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-0 bg-transparent p-0 shadow-none">
        <div className="relative w-full rounded-lg bg-white px-6 py-8 shadow-2xl sm:px-8">
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3 pl-10">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Subscribe to AI News</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Get the latest AI news, research updates, and industry insights delivered to your inbox weekly.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
              className="h-12 rounded-md border-2 border-muted text-base focus-visible:ring-primary"
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex-1 overflow-hidden rounded-md text-sm font-semibold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span className="absolute inset-0 rounded-md bg-gradient-to-b from-red-300 via-red-500 to-red-600 opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100" />
                <span className="absolute inset-0 rounded-md blur-md bg-red-500 opacity-60 group-hover:opacity-80" />
                <span className="relative z-10 flex h-12 items-center justify-center gap-2">
                  {loading ? "Subscribing..." : "Subscribe"}
                  <svg
                    className="h-4 w-4 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
                <svg className="pointer-events-none absolute inset-0 opacity-0 group-active:opacity-100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" />
                </svg>
              </button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 border-2 border-muted text-sm font-medium"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { NewsletterModal } from "./NewsletterModal";
import { SearchBar } from "./SearchBar";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { SearchEventDetail } from "@/lib/search";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const { isAdmin } = useAdminAuth();
  const [isCompressed, setIsCompressed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompressed(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 backdrop-blur-xl transition-all duration-300",
        isCompressed ? "bg-white/95 shadow-glass py-3" : "bg-white/75 py-5"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 sm:px-6 lg:px-[120px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/ai-logo.svg"
              alt="AI Nexus logo"
              className="h-12 w-12 rounded-2xl shadow-glass"
              loading="lazy"
              width={48}
              height={48}
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                Live AI Intelligence
              </p>
              <h1 className="text-3xl font-logo font-bold tracking-tight text-foreground">
                AI NEXUS
              </h1>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <SearchBar
              onSearch={(query) => {
                const detail: SearchEventDetail = { query };
                const event = new CustomEvent<SearchEventDetail>("search", { detail });
                window.dispatchEvent(event);
              }}
            />
            <button
              onClick={() => setNewsletterOpen(true)}
              className="rounded-full border border-primary/30 px-6 py-2 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Subscribe
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-3 overflow-x-auto rounded-2xl border border-border/70 bg-white/90 px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-inner scrollbar-hide">
          <NavLink
            to="/"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Home
          </NavLink>
          <NavLink
            to="/models"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Models & Tech
          </NavLink>
          <NavLink
            to="/tools"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Tools
          </NavLink>
          <NavLink
            to="/business"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Business
          </NavLink>
          <NavLink
            to="/research"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Research
          </NavLink>
          <NavLink
            to="/robotics"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Robotics
          </NavLink>
          <NavLink
            to="/guides"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Guides
          </NavLink>
          <NavLink
            to="/tracker"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            AI Tracker
          </NavLink>
          <NavLink
            to="/weekly"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            Weekly Top 10
          </NavLink>
          <NavLink
            to="/history"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
          >
            AI History
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-primary/10 hover:text-foreground"
            >
              Admin
            </NavLink>
          )}
        </nav>
      </div>

      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </header>
  );
};

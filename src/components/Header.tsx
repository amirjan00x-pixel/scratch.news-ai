import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { NewsletterModal } from "./NewsletterModal";
import { SearchBar } from "./SearchBar";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { SearchEventDetail } from "@/lib/search";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles, Bell } from "lucide-react";

export const Header = () => {
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const { isAdmin } = useAdminAuth();
  const [isCompressed, setIsCompressed] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompressed(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation items grouped
  const mainNav = [
    { to: "/", label: "Home" },
    { to: "/models", label: "Models" },
    { to: "/tools", label: "Tools" },
    { to: "/business", label: "Business" },
    { to: "/research", label: "Research" },
  ];

  const moreNav = [
    { to: "/robotics", label: "Robotics" },
    { to: "/guides", label: "Guides" },
    { to: "/tracker", label: "AI Tracker" },
    { to: "/weekly", label: "Weekly Top 10" },
    { to: "/history", label: "AI History" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        isCompressed
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-black/5 border-border/40 py-2"
          : "bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-transparent py-4"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/ai-logo.svg"
              alt="AI Nexus logo"
              className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              width={40}
              height={40}
            />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground font-medium">
              Live AI Intelligence
            </p>
            <h1 className="text-xl font-logo font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              AI NEXUS
            </h1>
          </div>
        </a>

        {/* Main Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-muted/50 backdrop-blur-sm rounded-full px-2 py-1.5 border border-border/50">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white hover:text-foreground hover:shadow-sm"
            >
              {item.label}
            </NavLink>
          ))}

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              onBlur={() => setTimeout(() => setMoreMenuOpen(false), 150)}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white hover:text-foreground hover:shadow-sm"
            >
              More
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreMenuOpen && "rotate-180")} />
            </button>

            {moreMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-border/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-black/10 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {moreNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <>
                    <div className="mx-3 my-2 border-t border-border/50" />
                    <NavLink
                      to="/admin"
                      className="block px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Admin Panel
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchBar
            onSearch={(query) => {
              const detail: SearchEventDetail = { query };
              const event = new CustomEvent<SearchEventDetail>("search", { detail });
              window.dispatchEvent(event);
            }}
          />

          {/* Subscribe Button - Glassmorphism */}
          <button
            onClick={() => setNewsletterOpen(true)}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Subscribe</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 pb-2 pt-3 scrollbar-hide">
        {[...mainNav, ...moreNav.slice(0, 3)].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex-shrink-0 rounded-full bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground"
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </header>
  );
};

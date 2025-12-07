import { useState } from "react";
import { Sparkles } from "lucide-react";
import { NavLink } from "./NavLink";
import { NewsletterModal } from "./NewsletterModal";
import { SearchBar } from "./SearchBar";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { SearchEventDetail } from "@/lib/search";

export const Header = () => {
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const { isAdmin } = useAdminAuth();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-logo font-bold text-foreground tracking-tight">AI NEWS</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={(query) => {
                const detail: SearchEventDetail = { query };
                const event = new CustomEvent<SearchEventDetail>('search', { detail });
                window.dispatchEvent(event);
              }}
            />
            <button 
              onClick={() => setNewsletterOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Subscribe
            </button>
          </div>
        </div>
        
        <nav className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <NavLink to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</NavLink>
          <NavLink to="/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Models & Tech</NavLink>
          <NavLink to="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tools</NavLink>
          <NavLink to="/business" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Business</NavLink>
          <NavLink to="/research" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Research</NavLink>
          <NavLink to="/robotics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Robotics</NavLink>
          <NavLink to="/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guides</NavLink>
          <NavLink to="/tracker" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Tracker</NavLink>
          <NavLink to="/weekly" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Weekly Top 10</NavLink>
          <NavLink to="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI History</NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </NavLink>
          )}
        </nav>
      </div>

      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </header>
  );
};

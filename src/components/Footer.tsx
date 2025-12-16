import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-24 bg-[#0B1424] bg-[radial-gradient(circle_at_top,#1E2C4D,transparent)] text-[#F3F7FF]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-[120px]">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/ai-logo.svg" alt="AI Nexus" className="h-12 w-12 rounded-2xl bg-white/10 p-2" />
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">AI Nexus</p>
                <h3 className="text-2xl font-semibold text-white">Global AI Briefings</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70">
              We curate real-time AI intelligence, research breakthroughs, and strategic insights for technology leaders worldwide.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/" className="transition hover:text-[hsl(var(--neon-cyan))]">Home</Link></li>
              <li><Link to="/weekly" className="transition hover:text-[hsl(var(--neon-cyan))]">Weekly Top 10</Link></li>
              <li><Link to="/guides" className="transition hover:text-[hsl(var(--neon-cyan))]">Guides</Link></li>
              <li><Link to="/tracker" className="transition hover:text-[hsl(var(--neon-cyan))]">AI Tracker</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/history" className="transition hover:text-[hsl(var(--neon-cyan))]">AI History</Link></li>
              <li><Link to="/" className="transition hover:text-[hsl(var(--neon-cyan))]">Newsletter</Link></li>
              <li><Link to="/" className="transition hover:text-[hsl(var(--neon-cyan))]">API Access</Link></li>
              <li><Link to="/" className="transition hover:text-[hsl(var(--neon-cyan))]">RSS Feed</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Newsletter</h3>
            <p className="mt-4 text-sm text-white/70">Weekly digest with trends, funding rounds, and research briefs.</p>
            <form className="mt-4 space-y-3">
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-white/90 px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-[#0B1424] transition hover:bg-white"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs uppercase tracking-[0.4em] text-white/50">
          © {new Date().getFullYear()} AI Nexus. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

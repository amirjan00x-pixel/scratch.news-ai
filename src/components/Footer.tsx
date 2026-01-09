import { Link } from "react-router-dom";
import { useState } from "react";
import { Twitter, Linkedin, Github, Mail, ArrowRight, Sparkles } from "lucide-react";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/models", label: "AI Models" },
    { to: "/tools", label: "AI Tools" },
    { to: "/business", label: "Business" },
    { to: "/research", label: "Research" },
  ];

  const resources = [
    { to: "/weekly", label: "Weekly Top 10" },
    { to: "/guides", label: "Guides" },
    { to: "/tracker", label: "AI Tracker" },
    { to: "/history", label: "AI History" },
    { to: "/robotics", label: "Robotics" },
  ];

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Mail, href: "mailto:hello@ainexus.io", label: "Email" },
  ];

  return (
    <footer className="relative mt-24 bg-slate-950">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/ai-logo.svg"
                  alt="AI Nexus"
                  className="h-12 w-12 rounded-xl bg-white/10 p-2 backdrop-blur-sm"
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Live Intelligence</p>
                <h3 className="text-xl font-bold text-white">AI NEXUS</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Curating real-time AI intelligence, research breakthroughs, and strategic insights for technology leaders worldwide.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center text-sm text-slate-400 transition-all duration-200 hover:text-white hover:translate-x-1"
                  >
                    <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-5">
              Resources
            </h3>
            <ul className="space-y-3">
              {resources.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center text-sm text-slate-400 transition-all duration-200 hover:text-white hover:translate-x-1"
                  >
                    <ArrowRight className="mr-2 h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-5">
              Newsletter
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              Get weekly AI trends, funding rounds, and research briefs delivered to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={subscribed}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {subscribed ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      Join Now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} AI Nexus. All rights reserved. Built with ❤️ for the AI community.
          </p>
        </div>
      </div>
    </footer>
  );
};

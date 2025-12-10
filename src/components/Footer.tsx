import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">About</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted source for the latest AI news, research, and breakthroughs from around the world.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Technology</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Research</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Business</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/history" className="text-muted-foreground hover:text-foreground transition-colors">AI History</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Newsletter</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">API</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">RSS Feed</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 AI News. All rights reserved. Powered by AI aggregation technology.</p>
        </div>
      </div>
    </footer>
  );
};

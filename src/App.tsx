import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AIHistory from "./pages/AIHistory";
import Models from "./pages/Models";
import Tools from "./pages/Tools";
import Business from "./pages/Business";
import Research from "./pages/Research";
import Robotics from "./pages/Robotics";
import Guides from "./pages/Guides";
import Tracker from "./pages/Tracker";
import Weekly from "./pages/Weekly";
import Posts from "./pages/Posts";
import Post from "./pages/Post";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/models" element={<Models />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/business" element={<Business />} />
          <Route path="/research" element={<Research />} />
          <Route path="/robotics" element={<Robotics />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/history" element={<AIHistory />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/:id" element={<Post />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Explorer from "./pages/Explorer.tsx";
import Methodology from "./pages/Methodology.tsx";
import Findings from "./pages/Findings.tsx";
import About from "./pages/About.tsx";
import MinistryAgri from "./pages/MinistryAgri.tsx";
import AgriJourney from "./pages/AgriJourney.tsx";
import Builder from "./pages/Builder.tsx";
import States from "./pages/States.tsx";
import StateUttarPradesh from "./pages/StateUttarPradesh.tsx";
import UPAgriJourney from "./pages/UPAgriJourney.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/findings" element={<Findings />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/about" element={<About />} />
          <Route path="/explorer/ministry/magri" element={<MinistryAgri />} />
          <Route path="/explorer/ministry/agriculture" element={<AgriJourney />} />
          <Route path="/agri-journey" element={<AgriJourney />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/states" element={<States />} />
          <Route path="/states/uttar-pradesh" element={<StateUttarPradesh />} />
          <Route path="/states/uttar-pradesh/agriculture" element={<UPAgriJourney />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

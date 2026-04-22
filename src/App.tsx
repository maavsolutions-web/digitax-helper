import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Signup from "./pages/Signup.tsx";
import Profile from "./pages/Profile.tsx";
import Upload from "./pages/Upload.tsx";
import Processing from "./pages/Processing.tsx";
import Report from "./pages/Report.tsx";
import Checkout from "./pages/Checkout.tsx";
import NotFound from "./pages/NotFound.tsx";
import CaLogin from "./pages/ca/CaLogin.tsx";
import MitraDashboard from "./pages/ca/MitraDashboard.tsx";
import Clients from "./pages/ca/Clients.tsx";
import Pipeline from "./pages/ca/Pipeline.tsx";
import ClientDetail from "./pages/ca/ClientDetail.tsx";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeByRoute } from "./components/ThemeByRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeByRoute />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/report" element={<Report />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/ca/login" element={<CaLogin />} />
            <Route path="/mitra" element={<MitraDashboard />} />
            <Route path="/mitra/clients" element={<Clients />} />
            <Route path="/mitra/clients/:id" element={<ClientDetail />} />
            <Route path="/mitra/pipeline" element={<Pipeline />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

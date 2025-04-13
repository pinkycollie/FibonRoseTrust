import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Verifications from "@/pages/Verifications";
import NftAuthentication from "@/pages/NftAuthentication";
import VerificationHistoryPage from "@/pages/VerificationHistoryPage";
import ApiIntegrations from "@/pages/ApiIntegrations";
import Settings from "@/pages/Settings";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "./hooks/use-sidebar";
import { ASLSupport } from "@/components/accessibility/ASLSupport";
import { VisualAccessibility } from "@/components/accessibility/VisualAccessibility";

function Router() {
  const { isSidebarOpen } = useSidebar();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/verifications" component={Verifications} />
            <Route path="/nft-authentication" component={NftAuthentication} />
            <Route path="/verification-history" component={VerificationHistoryPage} />
            <Route path="/api-integrations" component={ApiIntegrations} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      {/* Accessibility Features */}
      <ASLSupport />
      <VisualAccessibility />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

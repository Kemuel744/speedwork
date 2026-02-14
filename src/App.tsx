import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Subscription from "@/pages/Subscription";
import AccessCode from "@/pages/AccessCode";
import Dashboard from "@/pages/Dashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import Documents from "@/pages/Documents";
import CreateDocument from "@/pages/CreateDocument";
import DocumentDetail from "@/pages/DocumentDetail";
import ClientsPage from "@/pages/Clients";
import ClientDetailPage from "@/pages/ClientDetail";
import Profile from "@/pages/Profile";
import SettingsPage from "@/pages/Settings";
import AdminSubscriptions from "@/pages/AdminSubscriptions";
import AnnualReview from "@/pages/AnnualReview";
import Reminders from "@/pages/Reminders";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CompanyProvider>
        <DocumentsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/access-code" element={<AccessCode />} />
              <Route path="/" element={<Navigate to="/subscription" replace />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/create/:type" element={<CreateDocument />} />
                <Route path="/edit/:id" element={<CreateDocument />} />
                <Route path="/document/:id" element={<DocumentDetail />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/:clientId" element={<ClientDetailPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/annual-review" element={<AnnualReview />} />
                <Route path="/reminders" element={<Reminders />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DocumentsProvider>
        </CompanyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

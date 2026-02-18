import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Home from "@/pages/Home";

// Lazy-loaded pages for code splitting
const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const Login = lazy(() => import("@/pages/Login"));
const Features = lazy(() => import("@/pages/Features"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const AccessCode = lazy(() => import("@/pages/AccessCode"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const Documents = lazy(() => import("@/pages/Documents"));
const CreateDocument = lazy(() => import("@/pages/CreateDocument"));
const DocumentDetail = lazy(() => import("@/pages/DocumentDetail"));
const SharedDocument = lazy(() => import("@/pages/SharedDocument"));
const ClientsPage = lazy(() => import("@/pages/Clients"));
const ClientDetailPage = lazy(() => import("@/pages/ClientDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const AdminSubscriptions = lazy(() => import("@/pages/AdminSubscriptions"));
const AdminClients = lazy(() => import("@/pages/AdminClients"));
const AnnualReview = lazy(() => import("@/pages/AnnualReview"));
const Reminders = lazy(() => import("@/pages/Reminders"));
const Reports = lazy(() => import("@/pages/Reports"));
const Contact = lazy(() => import("@/pages/Contact"));
const Messages = lazy(() => import("@/pages/Messages"));
const TeamManagement = lazy(() => import("@/pages/TeamManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CompanyProvider>
        <CurrencyProvider>
        <DocumentsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/fonctionnalites" element={<Features />} />
                <Route path="/tarifs" element={<Subscription />} />
                <Route path="/login" element={<Login />} />
                <Route path="/subscription" element={<Navigate to="/tarifs" replace />} />
                <Route path="/share/:token" element={<SharedDocument />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/access-code" element={<AccessCode />} />
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
                  <Route path="/admin/clients" element={<AdminClients />} />
                  <Route path="/annual-review" element={<AnnualReview />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/team" element={<TeamManagement />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </DocumentsProvider>
        </CurrencyProvider>
        </CompanyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

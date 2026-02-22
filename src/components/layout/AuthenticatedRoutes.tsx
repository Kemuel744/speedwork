import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const Documents = lazy(() => import("@/pages/Documents"));
const CreateDocument = lazy(() => import("@/pages/CreateDocument"));
const DocumentDetail = lazy(() => import("@/pages/DocumentDetail"));
const ClientsPage = lazy(() => import("@/pages/Clients"));
const ClientDetailPage = lazy(() => import("@/pages/ClientDetail"));
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const AdminSubscriptions = lazy(() => import("@/pages/AdminSubscriptions"));
const AdminClients = lazy(() => import("@/pages/AdminClients"));
const AnnualReview = lazy(() => import("@/pages/AnnualReview"));
const Reminders = lazy(() => import("@/pages/Reminders"));
const Reports = lazy(() => import("@/pages/Reports"));
const Messages = lazy(() => import("@/pages/Messages"));
const TeamManagement = lazy(() => import("@/pages/TeamManagement"));
const Learning = lazy(() => import("@/pages/Learning"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <CurrencyProvider>
          <DocumentsProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
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
                  <Route path="/learning" element={<Learning />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </DocumentsProvider>
        </CurrencyProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

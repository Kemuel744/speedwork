import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import EnterpriseGuard from "@/components/layout/EnterpriseGuard";

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

const AdminBlog = lazy(() => import("@/pages/AdminBlog"));
const Teams = lazy(() => import("@/pages/Teams"));
const TeamDetail = lazy(() => import("@/pages/TeamDetail"));
const TeamsMap = lazy(() => import("@/pages/TeamsMap"));
const Workers = lazy(() => import("@/pages/Workers"));
const WorkerDetail = lazy(() => import("@/pages/WorkerDetail"));
const WorkerDashboard = lazy(() => import("@/pages/WorkerDashboard"));
const WorkTasks = lazy(() => import("@/pages/WorkTasks"));
const ProductivityMap = lazy(() => import("@/pages/ProductivityMap"));
const Missions = lazy(() => import("@/pages/Missions"));
const Attendance = lazy(() => import("@/pages/Attendance"));
const Payroll = lazy(() => import("@/pages/Payroll"));
const ProductivityAnalytics = lazy(() => import("@/pages/ProductivityAnalytics"));
const ReliabilityScores = lazy(() => import("@/pages/ReliabilityScores"));
const MissionsMap = lazy(() => import("@/pages/MissionsMap"));
const WorkerOnboarding = lazy(() => import("@/pages/WorkerOnboarding"));
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
                  <Route path="/team" element={<EnterpriseGuard><TeamManagement /></EnterpriseGuard>} />
                  <Route path="/learning" element={<Navigate to="/guide" replace />} />
                  <Route path="/admin/blog" element={<AdminBlog />} />
                  <Route path="/teams" element={<EnterpriseGuard><Teams /></EnterpriseGuard>} />
                  <Route path="/teams/:teamId" element={<EnterpriseGuard><TeamDetail /></EnterpriseGuard>} />
                  <Route path="/teams-map" element={<Navigate to="/missions-map" replace />} />
                  <Route path="/workers" element={<EnterpriseGuard><Workers /></EnterpriseGuard>} />
                  <Route path="/workers/:workerId" element={<EnterpriseGuard><WorkerDetail /></EnterpriseGuard>} />
                  <Route path="/worker-dashboard" element={<EnterpriseGuard><WorkerDashboard /></EnterpriseGuard>} />
                  <Route path="/work-tasks" element={<EnterpriseGuard><WorkTasks /></EnterpriseGuard>} />
                  <Route path="/productivity" element={<EnterpriseGuard><ProductivityMap /></EnterpriseGuard>} />
                  <Route path="/missions" element={<EnterpriseGuard><Missions /></EnterpriseGuard>} />
                  <Route path="/attendance" element={<EnterpriseGuard><Attendance /></EnterpriseGuard>} />
                  <Route path="/payroll" element={<EnterpriseGuard><Payroll /></EnterpriseGuard>} />
                  <Route path="/analytics" element={<EnterpriseGuard><ProductivityAnalytics /></EnterpriseGuard>} />
                  <Route path="/reliability" element={<EnterpriseGuard><ReliabilityScores /></EnterpriseGuard>} />
                  <Route path="/missions-map" element={<EnterpriseGuard><MissionsMap /></EnterpriseGuard>} />
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

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { DocumentsProvider } from "@/contexts/DocumentsContext";

const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Reports = lazy(() => import("@/pages/Reports"));
const Profile = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const AdminSubscriptions = lazy(() => import("@/pages/AdminSubscriptions"));
const AdminBlog = lazy(() => import("@/pages/AdminBlog"));
const Messages = lazy(() => import("@/pages/Messages"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Categories = lazy(() => import("@/pages/Categories"));
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
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/inventory" element={<Reports />} />
                  <Route path="/sales-history" element={<Reports />} />
                  <Route path="/statistics" element={<Reports />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                  <Route path="/admin/blog" element={<AdminBlog />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/categories" element={<Categories />} />
                  {/* Redirects from old routes */}
                  <Route path="/documents" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/clients" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/workers" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/teams" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/missions" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/attendance" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/payroll" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/reliability" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/annual-review" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/reminders" element={<Navigate to="/dashboard" replace />} />
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

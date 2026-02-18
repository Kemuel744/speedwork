import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "@/pages/Home";

// Lazy-loaded pages for code splitting
const AuthenticatedRoutes = lazy(() => import("@/components/layout/AuthenticatedRoutes"));
const LoginWithAuth = lazy(() => import("@/components/layout/LoginWithAuth"));
const Features = lazy(() => import("@/pages/Features"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const AccessCode = lazy(() => import("@/pages/AccessCode"));
const SharedDocument = lazy(() => import("@/pages/SharedDocument"));
const Contact = lazy(() => import("@/pages/Contact"));

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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes – no heavy providers */}
            <Route path="/" element={<Home />} />
            <Route path="/fonctionnalites" element={<Features />} />
            <Route path="/tarifs" element={<Subscription />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/share/:token" element={<SharedDocument />} />
            <Route path="/subscription" element={<Navigate to="/tarifs" replace />} />
            <Route path="/access-code" element={<AccessCode />} />

            {/* Login needs AuthProvider */}
            <Route path="/login" element={<LoginWithAuth />} />

            {/* Authenticated routes – all providers lazy loaded */}
            <Route path="/*" element={<AuthenticatedRoutes />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

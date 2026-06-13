import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "@/pages/Home";
import { OfflineBanner, InstallPWABanner, UpdateAvailableBanner } from "@/components/PWABanners";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

const AuthenticatedRoutes = lazy(() => import("@/components/layout/AuthenticatedRoutes"));
const LoginWithAuth = lazy(() => import("@/components/layout/LoginWithAuth"));
const Features = lazy(() => import("@/pages/Features"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const AccessCode = lazy(() => import("@/pages/AccessCode"));
const Contact = lazy(() => import("@/pages/Contact"));
const InstallApp = lazy(() => import("@/pages/InstallApp"));
const Guide = lazy(() => import("@/pages/Guide"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogArticle = lazy(() => import("@/pages/BlogArticle"));
const About = lazy(() => import("@/pages/About"));
const PublicPurchaseOrder = lazy(() => import("@/pages/PublicPurchaseOrder"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <HelmetProvider>
  <ThemeProvider>
  <LanguageProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fonctionnalites" element={<Features />} />
            <Route path="/tarifs" element={<Subscription />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/subscription" element={<Navigate to="/tarifs" replace />} />
            <Route path="/access-code" element={<AccessCode />} />
            <Route path="/installer" element={<InstallApp />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/purchase-order/:token" element={<PublicPurchaseOrder />} />
            <Route path="/login" element={<LoginWithAuth />} />
            <Route path="/*" element={<AuthenticatedRoutes />} />
          </Routes>
        </Suspense>
        <OfflineBanner />
        <InstallPWABanner />
        <UpdateAvailableBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </LanguageProvider>
  </ThemeProvider>
  </HelmetProvider>
);

export default App;

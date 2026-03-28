import React, { Suspense, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { InstallPrompt } from "./components/InstallPrompt";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { GlobalActionsProvider } from "./contexts/GlobalActionsContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "./hooks/useAuth";
import { PageLoader } from "./components/ui/page-loader";

// Lazy load all page components for code splitting
const Index = React.lazy(() => import("./pages/Index"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const SuperAdmin = React.lazy(() => import("./pages/SuperAdmin"));
const LabProfile = React.lazy(() => import("./pages/LabProfile"));
const BranchSettings = React.lazy(() => import("./pages/BranchSettings"));
const PatientHistory = React.lazy(() => import("./pages/PatientHistory"));
const DataManagement = React.lazy(() => import("./pages/DataManagement"));
const AuditLogs = React.lazy(() => import("./pages/AuditLogs"));
const ApiSettings = React.lazy(() => import("./pages/ApiSettings"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Followups = React.lazy(() => import("./pages/Followups"));
const OutstandingReport = React.lazy(() => import("./pages/OutstandingReport"));
const Reports = React.lazy(() => import("./pages/Reports"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const PublicFeedback = React.lazy(() => import("./pages/PublicFeedback"));
const SalesLeads = React.lazy(() => import("./pages/SalesLeads"));
const ProductTour = React.lazy(() => import("./pages/ProductTour"));
const Blog = React.lazy(() => import("./pages/Blog"));
const WhatIsLims = React.lazy(() => import("./pages/blog/WhatIsLims"));
const DigitizePathologyLab = React.lazy(() => import("./pages/blog/DigitizePathologyLab"));
const GstBillingLabs = React.lazy(() => import("./pages/blog/GstBillingLabs"));
const BillingFeatures = React.lazy(() => import("./pages/blog/BillingFeatures"));
const DigitalLabReports = React.lazy(() => import("./pages/blog/DigitalLabReports"));
const NablAccreditation = React.lazy(() => import("./pages/blog/NablAccreditation"));
const MultiBranchManagement = React.lazy(() => import("./pages/blog/MultiBranchManagement"));
const BestLimsIndia = React.lazy(() => import("./pages/blog/BestLimsIndia"));
const ReduceTurnaroundTime = React.lazy(() => import("./pages/blog/ReduceTurnaroundTime"));
const StaffManagementChallenges = React.lazy(() => import("./pages/blog/StaffManagementChallenges"));
const ReducePatientComplaints = React.lazy(() => import("./pages/blog/ReducePatientComplaints"));
const RevenueLeakagePrevention = React.lazy(() => import("./pages/blog/RevenueLeakagePrevention"));
const SampleTracking = React.lazy(() => import("./pages/blog/SampleTracking"));
const LabReportFormats = React.lazy(() => import("./pages/blog/LabReportFormats"));
const DoctorReferralManagement = React.lazy(() => import("./pages/blog/DoctorReferralManagement"));
const LabDataSecurity = React.lazy(() => import("./pages/blog/LabDataSecurity"));
const WhatsappReports = React.lazy(() => import("./pages/blog/WhatsappReports"));
const LabAutomationRoi = React.lazy(() => import("./pages/blog/LabAutomationRoi"));
const PathologyIndustryTrends = React.lazy(() => import("./pages/blog/PathologyIndustryTrends"));
const AiInPathologyLabs = React.lazy(() => import("./pages/blog/AiInPathologyLabs"));
const PatientGuideLabReports = React.lazy(() => import("./pages/blog/PatientGuideLabReports"));
const LabTestPricing = React.lazy(() => import("./pages/blog/LabTestPricing"));
const PreventiveHealthCheckups = React.lazy(() => import("./pages/blog/PreventiveHealthCheckups"));
const LabQualityControl = React.lazy(() => import("./pages/blog/LabQualityControl"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = React.lazy(() => import("./pages/RefundPolicy"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes default stale time
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const AppHeader = () => {
  const { profile } = useAuth();
  const location = useLocation();
  
  // Don't show header on auth pages
  if (['/auth', '/forgot-password', '/'].includes(location.pathname)) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'operator_1': return 'bg-blue-500';
      case 'operator_2': return 'bg-green-500';
      case 'operator_3': return 'bg-purple-500';
      case 'lab_admin': return 'bg-orange-500';
      case 'super_admin': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <header className="h-16 flex items-center border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-40">
      <SidebarTrigger className="mr-4" />
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tight">
          LabFlow
        </h1>
        {profile && (
          <Badge className={`${getRoleColor(profile.role)} text-white`}>
            {profile.role.replace('_', ' ').toUpperCase()}
          </Badge>
        )}
      </div>
      {profile && (
        <span className="ml-auto text-sm text-muted-foreground">
          Welcome, {profile.full_name}
        </span>
      )}
    </header>
  );
};

const AppContent = () => {
  const location = useLocation();
  
  // Pages that should not have sidebar
  const noSidebarPages = ['/auth', '/forgot-password', '/', '/feedback', '/product-tour', '/blog', '/privacy-policy', '/terms-of-service', '/refund-policy'];
  const showSidebar = !noSidebarPages.includes(location.pathname) && !location.pathname.startsWith('/feedback') && !location.pathname.startsWith('/blog');

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful:', registration);
          })
          .catch((error) => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }
  }, []);

  if (!showSidebar) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/product-tour" element={<ProductTour />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/what-is-lims-software" element={<WhatIsLims />} />
          <Route path="/blog/how-to-digitize-pathology-lab" element={<DigitizePathologyLab />} />
          <Route path="/blog/gst-billing-for-pathology-labs" element={<GstBillingLabs />} />
          <Route path="/blog/lab-billing-software-features" element={<BillingFeatures />} />
          <Route path="/blog/digital-lab-reports-guide" element={<DigitalLabReports />} />
          <Route path="/blog/nabl-accreditation-guide" element={<NablAccreditation />} />
          <Route path="/blog/multi-branch-lab-management" element={<MultiBranchManagement />} />
          <Route path="/blog/best-lims-software-india" element={<BestLimsIndia />} />
          <Route path="/blog/reduce-lab-report-turnaround-time" element={<ReduceTurnaroundTime />} />
          <Route path="/blog/lab-staff-management-challenges" element={<StaffManagementChallenges />} />
          <Route path="/blog/reduce-patient-complaints-pathology-lab" element={<ReducePatientComplaints />} />
          <Route path="/blog/lab-revenue-leakage-prevention" element={<RevenueLeakagePrevention />} />
          <Route path="/blog/sample-tracking-pathology-lab" element={<SampleTracking />} />
          <Route path="/blog/lab-report-formats-templates" element={<LabReportFormats />} />
          <Route path="/blog/doctor-referral-management-labs" element={<DoctorReferralManagement />} />
          <Route path="/blog/lab-data-security-hipaa-india" element={<LabDataSecurity />} />
          <Route path="/blog/whatsapp-reports-patient-communication" element={<WhatsappReports />} />
          <Route path="/blog/lab-automation-roi-calculator" element={<LabAutomationRoi />} />
          <Route path="/blog/pathology-lab-industry-trends-india-2026" element={<PathologyIndustryTrends />} />
          <Route path="/blog/ai-machine-learning-pathology-labs" element={<AiInPathologyLabs />} />
          <Route path="/blog/patient-guide-understanding-lab-reports" element={<PatientGuideLabReports />} />
          <Route path="/blog/why-lab-tests-cost-different-prices" element={<LabTestPricing />} />
          <Route path="/blog/preventive-health-checkup-guide-india" element={<PreventiveHealthCheckups />} />
          <Route path="/blog/lab-quality-control-best-practices" element={<LabQualityControl />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/feedback" element={<PublicFeedback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <GlobalActionsProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-auto">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/outstanding-report" element={<OutstandingReport />} />
                  <Route path="/super-admin" element={<SuperAdmin />} />
                  <Route path="/super-admin/data-management" element={<DataManagement />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/api-settings" element={<ApiSettings />} />
                  <Route path="/lab-profile" element={<LabProfile />} />
                  <Route path="/branch-settings" element={<BranchSettings />} />
                  <Route path="/patient-history" element={<PatientHistory />} />
                  <Route path="/patient/:patientId" element={<PatientHistory />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/followups" element={<Followups />} />
                  <Route path="/sales-leads" element={<SalesLeads />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
        <CommandPalette />
        <KeyboardShortcuts />
      </SidebarProvider>
    </GlobalActionsProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

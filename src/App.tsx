import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuperAdmin from "./pages/SuperAdmin";
import LabProfile from "./pages/LabProfile";
import BranchSettings from "./pages/BranchSettings";
import PatientHistory from "./pages/PatientHistory";
import DataManagement from "./pages/DataManagement";
import AuditLogs from "./pages/AuditLogs";
import ApiSettings from "./pages/ApiSettings";
import Analytics from "./pages/Analytics";
import Followups from "./pages/Followups";
import ForgotPassword from "./pages/ForgotPassword";
import PublicFeedback from "./pages/PublicFeedback";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

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
          Lab Master
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
  const noSidebarPages = ['/auth', '/forgot-password', '/', '/feedback'];
  const showSidebar = !noSidebarPages.includes(location.pathname) && !location.pathname.startsWith('/feedback');

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
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/feedback" element={<PublicFeedback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
      <CommandPalette />
      <KeyboardShortcuts />
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

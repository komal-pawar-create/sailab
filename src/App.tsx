import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/super-admin/data-management" element={<DataManagement />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/api-settings" element={<ApiSettings />} />
          <Route path="/lab-profile" element={<LabProfile />} />
          <Route path="/branch-settings" element={<BranchSettings />} />
          <Route path="/patient-history" element={<PatientHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

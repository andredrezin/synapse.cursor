import "./i18n/config";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import PixelGenerator from "./pages/PixelGenerator";
import Conversations from "./pages/Conversations";
import ChatRoom from "./pages/ChatRoom";
import Team from "./pages/Team";
import Leads from "./pages/Leads";
import Settings from "./pages/Settings";
import LeadScoring from "./pages/LeadScoring";
import Reports from "./pages/Reports";
import Automations from "./pages/Automations";
import Alerts from "./pages/Alerts";
import Templates from "./pages/Templates";
import WhatsAppConnections from "./pages/WhatsAppConnections";
import KnowledgeBase from "./pages/KnowledgeBase";
import AISettings from "./pages/AISettings";
import Pricing from "./pages/Pricing";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import ChurnAnalytics from "./pages/ChurnAnalytics";
import AIAnalytics from "./pages/AIAnalytics";
import SellerDashboard from "./pages/SellerDashboard";
import LeadDistributionSettings from "./pages/LeadDistributionSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Onboarding - requires auth but not onboarding completion */}
              <Route path="/onboarding" element={
                <ProtectedRoute requireOnboarding={false} requireWorkspace={false}>
                  <Onboarding />
                </ProtectedRoute>
              } />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/dashboard/pixel" element={<ProtectedRoute><PixelGenerator /></ProtectedRoute>} />
              <Route path="/dashboard/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
              <Route path="/dashboard/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
              <Route path="/dashboard/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/dashboard/scoring" element={<ProtectedRoute><LeadScoring /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/dashboard/automations" element={<ProtectedRoute><Automations /></ProtectedRoute>} />
              <Route path="/dashboard/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
              <Route path="/dashboard/whatsapp" element={<ProtectedRoute><WhatsAppConnections /></ProtectedRoute>} />
              <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
              <Route path="/dashboard/ai-settings" element={<ProtectedRoute><AISettings /></ProtectedRoute>} />
              <Route path="/dashboard/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
              <Route path="/dashboard/checkout-success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
              <Route path="/dashboard/subscription-cancel" element={<ProtectedRoute><SubscriptionCancel /></ProtectedRoute>} />
              <Route path="/dashboard/churn-analytics" element={<ProtectedRoute><ChurnAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/ai-analytics" element={<ProtectedRoute><AIAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/lead-distribution" element={<ProtectedRoute><LeadDistributionSettings /></ProtectedRoute>} />
              <Route path="/dashboard/chat/:conversationId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

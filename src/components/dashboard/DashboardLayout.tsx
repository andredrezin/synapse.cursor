import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import AIGuideButton from "@/components/ai-guide/AIGuideButton";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { showOnboarding, openOnboarding, closeOnboarding, isOnboardingCompleted } = useOnboarding();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Onboarding button for users who completed or dismissed */}
      {isOnboardingCompleted && (
        <Button
          onClick={openOnboarding}
          variant="outline"
          size="sm"
          className="fixed bottom-20 right-6 z-40 gap-2"
        >
          <BookOpen className="h-4 w-4" />
          {t('common.guide')}
        </Button>
      )}
      
      <AIGuideButton />
      <OnboardingModal open={showOnboarding} onOpenChange={closeOnboarding} />
    </div>
  );
};

export default DashboardLayout;

import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import AIGuideButton from "@/components/ai-guide/AIGuideButton";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    showOnboarding,
    openOnboarding,
    closeOnboarding,
    isOnboardingCompleted,
  } = useOnboarding();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-collapse sidebar on mobile logic handled by layout structure

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar (Drawer) */}
      {isMobile ? (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="p-0 w-64 border-r border-sidebar-border bg-sidebar"
          >
            <DashboardSidebar
              isOpen={true}
              onToggle={() => setMobileMenuOpen(false)}
              isMobile={true}
            />
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop Sidebar */
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobile={false}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isMobile ? "ml-0" : sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
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
          {t("common.guide")}
        </Button>
      )}

      <AIGuideButton />
      <OnboardingModal open={showOnboarding} onOpenChange={closeOnboarding} />
    </div>
  );
};

export default DashboardLayout;

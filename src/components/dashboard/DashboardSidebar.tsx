import {
  LayoutDashboard,
  MessageCircle,
  Users,
  BarChart3,
  Settings,
  Bell,
  Zap,
  Target,
  FileText,
  ChevronLeft,
  LogOut,
  Code,
  UserCircle,
  Phone,
  BookOpen,
  Bot,
  CreditCard,
  Crown,
  Sparkles,
  TrendingDown,
  BrainCircuit,
  Brain,
  Shuffle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import {
  useSubscriptionContext,
  SubscriptionPlan,
} from "@/contexts/SubscriptionContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type PremiumRequirement = "professional" | "premium";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  href: string;
  adminOnly?: boolean;
  requiredPlan?: PremiumRequirement;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const getAdminMenuSections = (t: any): MenuSection[] => [
  {
    title: "Atendimento & Vendas",
    items: [
      { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/dashboard" },
      {
        icon: MessageCircle,
        labelKey: "nav.conversations",
        href: "/dashboard/conversations",
      },
      {
        icon: Phone,
        labelKey: "nav.whatsapp",
        href: "/dashboard/whatsapp",
        adminOnly: true,
      },
      { icon: Users, labelKey: "nav.leads", href: "/dashboard/leads" },
      {
        icon: Shuffle,
        labelKey: "nav.distribution",
        href: "/dashboard/lead-distribution",
        adminOnly: true,
      },
      {
        icon: FileText,
        labelKey: "nav.templates",
        href: "/dashboard/templates",
      },
    ],
  },
  {
    title: "IA Premium",
    items: [
      {
        icon: Bot,
        labelKey: "nav.aiSettings",
        href: "/dashboard/ai-settings",
        adminOnly: true,
        requiredPlan: "premium",
      },

      {
        icon: BrainCircuit,
        labelKey: "nav.aiAnalytics",
        href: "/dashboard/ai-analytics",
        adminOnly: true,
      },
      {
        icon: Brain,
        labelKey: "nav.aiLearning",
        href: "/dashboard/ai-learning",
        adminOnly: true,
        requiredPlan: "premium",
      },
      {
        icon: BookOpen,
        labelKey: "nav.knowledgeBase",
        href: "/dashboard/knowledge",
        adminOnly: true,
        requiredPlan: "professional",
      },
      { icon: Target, labelKey: "nav.leadScoring", href: "/dashboard/scoring" },
    ],
  },
  {
    title: "Gestão & Performance",
    items: [
      { icon: BarChart3, labelKey: "nav.reports", href: "/dashboard/reports" },
      { icon: Trophy, labelKey: "nav.ranking", href: "/dashboard/ranking" },
      {
        icon: Users,
        labelKey: "nav.team",
        href: "/dashboard/team",
        adminOnly: true,
      },
      {
        icon: TrendingDown,
        labelKey: "nav.churnAnalytics",
        href: "/dashboard/churn-analytics",
        adminOnly: true,
      },
    ],
  },
  {
    title: "Configurações",
    items: [
      {
        icon: Zap,
        labelKey: "nav.automations",
        href: "/dashboard/automations",
      },
      { icon: Bell, labelKey: "nav.alerts", href: "/dashboard/alerts" },
      {
        icon: CreditCard,
        labelKey: "nav.subscription",
        href: "/dashboard/pricing",
      },
      {
        icon: Code,
        labelKey: "nav.pixel",
        href: "/dashboard/pixel",
        adminOnly: true,
      },
    ],
  },
];

const PLAN_HIERARCHY: SubscriptionPlan[] = [
  null,
  "basic",
  "professional",
  "premium",
];

const hasAccess = (
  userPlan: SubscriptionPlan,
  requiredPlan: PremiumRequirement,
): boolean => {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return userIndex >= requiredIndex;
};

const getPlanBadge = (
  requiredPlan: PremiumRequirement,
  userPlan: SubscriptionPlan,
  isOpen: boolean,
) => {
  const hasAccessToFeature = hasAccess(userPlan, requiredPlan);

  if (hasAccessToFeature) return null;

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute -top-1 -right-1">
            {requiredPlan === "premium" ? (
              <Crown className="w-3 h-3 text-amber-500" />
            ) : (
              <Sparkles className="w-3 h-3 text-blue-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{requiredPlan === "premium" ? "Premium" : "Professional"}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "ml-auto text-[10px] px-1.5 py-0 h-4",
        requiredPlan === "premium"
          ? "border-amber-500/50 text-amber-500 bg-amber-500/10"
          : "border-blue-500/50 text-blue-500 bg-blue-500/10",
      )}
    >
      {requiredPlan === "premium" ? (
        <Crown className="w-2.5 h-2.5 mr-0.5" />
      ) : (
        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
      )}
      {requiredPlan === "premium" ? "PRO" : "PLUS"}
    </Badge>
  );
};

// Menu items for seller users
const sellerMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    labelKey: "dashboard.myDashboard",
    href: "/dashboard/seller",
  },
  { icon: Trophy, labelKey: "nav.ranking", href: "/dashboard/ranking" },
  {
    icon: MessageCircle,
    labelKey: "dashboard.myConversations",
    href: "/dashboard/conversations",
  },
  { icon: Users, labelKey: "dashboard.myLeads", href: "/dashboard/leads" },
  { icon: Bell, labelKey: "nav.alerts", href: "/dashboard/alerts" },
];

// Menu items for member users (non-seller, non-admin)
const memberMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    labelKey: "dashboard.myDashboard",
    href: "/dashboard",
  },
  {
    icon: MessageCircle,
    labelKey: "dashboard.myConversations",
    href: "/dashboard/conversations",
  },
  { icon: Users, labelKey: "dashboard.myLeads", href: "/dashboard/leads" },
  { icon: Target, labelKey: "nav.leadScoring", href: "/dashboard/scoring" },
  { icon: Bell, labelKey: "nav.alerts", href: "/dashboard/alerts" },
];

const DashboardSidebar = ({ isOpen, onToggle }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin, isSeller, currentRole } = usePermissions();
  const { plan } = useSubscriptionContext();
  const { t } = useTranslation();

  // Select menu items based on role
  const getMenuContent = () => {
    if (isAdmin) return getAdminMenuSections(t);

    // For others, we still return as sections but maybe only one principal section
    const items = isSeller ? sellerMenuItems : memberMenuItems;
    return [{ title: "Principal", items }];
  };

  const sections = getMenuContent();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col",
        isOpen ? "w-64" : "w-20",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          {isOpen && (
            <span className="text-lg font-bold text-sidebar-foreground">
              WhatsMetrics
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 text-sidebar-foreground transition-transform",
              !isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Role Badge */}
      {isOpen && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <Badge
            variant={isAdmin ? "default" : "secondary"}
            className="w-full justify-center"
          >
            {currentRole}
          </Badge>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {isOpen && section.title && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 mt-4 first:mt-0">
                {section.title}
              </h3>
            )}
            {!isOpen && idx > 0 && (
              <div className="h-px bg-sidebar-border/50 mx-2 my-4" />
            )}

            {section.items.map((item) => {
              // Skip admin-only items for non-admin users
              if ("adminOnly" in item && item.adminOnly && !isAdmin)
                return null;

              const isActive = location.pathname === item.href;
              const premiumBadge = item.requiredPlan
                ? getPlanBadge(item.requiredPlan, plan, isOpen)
                : null;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-primary transition-colors",
                      )}
                    />
                    {!isOpen && premiumBadge}
                  </div>
                  {isOpen && (
                    <>
                      <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {t(item.labelKey)}
                      </span>
                      {premiumBadge}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link
          to="/dashboard/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            location.pathname === "/dashboard/profile" &&
              "bg-primary text-white shadow-lg shadow-primary/20",
          )}
        >
          <UserCircle className="w-5 h-5 flex-shrink-0" />
          {isOpen && (
            <span className="text-sm font-medium">{t("auth.profile")}</span>
          )}
        </Link>

        {isAdmin && (
          <Link
            to="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              location.pathname === "/dashboard/settings" &&
                "bg-primary text-white shadow-lg shadow-primary/20",
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && (
              <span className="text-sm font-medium">{t("auth.settings")}</span>
            )}
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && (
            <span className="text-sm font-medium">{t("auth.logout")}</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

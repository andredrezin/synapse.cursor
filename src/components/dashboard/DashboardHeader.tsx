import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserMenu } from "./UserMenu";
import { useNotifications } from "@/hooks/useNotifications";
import { formatTimeAgo } from "@/lib/mock-data";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useTranslation();
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-secondary rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            className="w-64 lg:w-80 h-10 pl-10 pr-4 rounded-lg bg-secondary border-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 glass rounded-xl shadow-xl overflow-hidden animate-slide-up">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">{t('notifications.title')}</span>
                {unreadCount > 0 && (
                  <button 
                    className="text-xs text-primary hover:underline"
                    onClick={() => markAllAsRead()}
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('notifications.noNotifications')}</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-3 border-b border-border/50 hover:bg-secondary/50 cursor-pointer ${!alert.is_read ? 'bg-primary/5' : ''}`}
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          alert.priority === 'high' ? 'bg-chart-red' :
                          alert.priority === 'medium' ? 'bg-chart-orange' : 'bg-primary'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTimeAgo(new Date(alert.created_at))} {t('common.ago')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    {t('notifications.viewAll')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="pl-3 border-l border-border">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

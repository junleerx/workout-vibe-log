import { Dumbbell, History, LogOut, User, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TabType = 'workout' | 'history' | 'calendar' | 'progress';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Header({ activeTab, onTabChange, userEmail, onSignOut }: HeaderProps) {
  const tabs = [
    { id: 'workout' as TabType, label: '운동', icon: Dumbbell },
    { id: 'history' as TabType, label: '기록', icon: History },
    { id: 'calendar' as TabType, label: '캘린더', icon: Calendar },
    { id: 'progress' as TabType, label: '진행', icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 glow-effect">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">Juni's Gym</h1>
          </div>
          
          {userEmail && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {userEmail}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground glow-effect'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

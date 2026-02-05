import { Dumbbell, History, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  activeTab: 'workout' | 'history';
  onTabChange: (tab: 'workout' | 'history') => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Header({ activeTab, onTabChange, userEmail, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 glow-effect">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">GymLog</h1>
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
        
        <nav className="flex gap-2">
          <button
            onClick={() => onTabChange('workout')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'workout'
                ? 'bg-primary text-primary-foreground glow-effect'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            운동
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground glow-effect'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            기록
          </button>
        </nav>
      </div>
    </header>
  );
}

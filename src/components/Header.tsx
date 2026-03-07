
import { useState } from 'react';
import { Dumbbell, History, LogOut, User, Calendar, TrendingUp, ClipboardList, Sparkles, Loader2, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMembers } from '@/hooks/useMembers';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { motion } from 'framer-motion';

type TabType = 'dashboard' | 'workout' | 'programs' | 'ai' | 'records';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Header({ activeTab, onTabChange, userEmail, onSignOut }: HeaderProps) {
  const { members, selectedMember, switchProfile } = useMembers();
  const { unit, toggleUnit } = useWeightUnit();
  const [converting, setConverting] = useState(false);

  const tabs = [
    { id: 'workout' as TabType, label: '운동', icon: Dumbbell },
    { id: 'programs' as TabType, label: '프로그램', icon: ClipboardList },
    { id: 'ai' as TabType, label: 'AI추천', icon: Sparkles },
    { id: 'records' as TabType, label: '기록', icon: History }
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-50 pt-[calc(var(--sa-top)+0.5rem)] pb-3 px-4 sm:px-6 pointer-events-none"
    >
      <div className="mx-auto max-w-5xl rounded-2xl glass card-shadow px-4 py-3 flex items-center justify-between transition-all duration-300 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden glow-effect flex-shrink-0">
            <img src="/logo-patch.jpg" alt="Juni's Gym" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 tracking-tight leading-none">
              Juni's Gym
            </h1>
            {selectedMember && (
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {selectedMember.name}님 운동중
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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

                {members.length > 0 && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      프로필 전환
                    </div>
                    {members.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => switchProfile(member.id)}
                        className={`cursor-pointer ${selectedMember?.id === member.id ? 'bg-accent font-medium' : ''}`}
                      >
                        <User className="mr-2 h-3 w-3" style={{ color: member.avatar_color || 'currentColor' }} />
                        {member.name}
                        {selectedMember?.id === member.id && <span className="ml-auto text-xs text-primary">●</span>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem asChild>
                      <a href="/profile-select" className="cursor-pointer text-primary">
                        <User className="mr-2 h-3 w-3" />
                        프로필 관리
                      </a>
                    </DropdownMenuItem>
                  </>
                )}

                <div className="h-px bg-border my-1" />
                <DropdownMenuItem
                  onClick={async () => {
                    setConverting(true);
                    await toggleUnit();
                    setConverting(false);
                  }}
                  disabled={converting}
                  className="cursor-pointer font-medium"
                >
                  {converting
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <span className="mr-2 text-base">🔄</span>
                  }
                  {converting
                    ? '변환 중...'
                    : unit === 'kg' ? 'lbs로 바꾸기' : 'kg로 바꾸기'
                  }
                  {!converting && <span className="ml-auto text-xs text-muted-foreground">현재: {unit.toUpperCase()}</span>}
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />

                <DropdownMenuItem onClick={onSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
}

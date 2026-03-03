import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { ProgressView } from '@/components/ProgressView';
import { ProgramsView } from '@/components/ProgramsView';
import { AIWorkoutView } from '@/components/AIWorkoutView';
import { DashboardView } from '@/components/DashboardView';
import { WorkoutSummary } from '@/components/WorkoutSummary';

import { useWorkoutCloud } from '@/hooks/useWorkoutCloud';
import { useWorkoutPrograms } from '@/hooks/useWorkoutPrograms';
import { useCustomExercises } from '@/hooks/useCustomExercises';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, BarChart2, ClipboardList, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workout } from '@/types/workout';

type TabType = 'dashboard' | 'workout' | 'programs' | 'ai' | 'records';

const TabTransition = ({ children, value, activeTab }: { children: React.ReactNode, value: string, activeTab: string }) => (
  <AnimatePresence mode="wait">
    {activeTab === value && (
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// 기록 + 통계를 하나의 탭으로 묶는 내부 컴포넌트
function RecordsTab({ workouts, selectedMember, onDeleteWorkout, onUpdateSavedSet }: {
  workouts: Workout[];
  selectedMember: any;
  onDeleteWorkout: (id: string) => void;
  onUpdateSavedSet?: (setId: string, updates: { weight?: number; reps?: number }) => Promise<void>;
}) {
  const [inner, setInner] = useState<'history' | 'progress'>('history');
  return (
    <div className="space-y-4">
      <div className="flex bg-secondary/50 p-1 rounded-2xl">
        <button
          onClick={() => setInner('history')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${inner === 'history' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          운동 기록
        </button>
        <button
          onClick={() => setInner('progress')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${inner === 'progress' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          통계 & PR
        </button>
      </div>
      {inner === 'history'
        ? <HistoryView workouts={workouts} onDeleteWorkout={onDeleteWorkout} onUpdateSavedSet={onUpdateSavedSet} />
        : <ProgressView workouts={workouts} selectedMember={selectedMember} />
      }
    </div>
  );
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { members, selectedMember, setSelectedMember, addMember, updateMember, deleteMember } = useMembers();
  const { workouts, currentWorkout, startWorkout, startWorkoutFromProgram, addExercise, removeExercise, addSet, updateSet, removeSet, finishWorkout, cancelWorkout, deleteWorkout, updateSavedSet } = useWorkoutCloud({ memberId: selectedMember?.id });
  const { programs, createProgram, updateProgram, deleteProgram } = useWorkoutPrograms({ memberId: selectedMember?.id });
  const { customExercises, addCustomExercise, deleteCustomExercise } = useCustomExercises();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [summaryWorkout, setSummaryWorkout] = useState<Workout | null>(null);

  const handleFinishWorkout = async () => {
    const snapshot = currentWorkout;
    const success = await finishWorkout();
    if (success) {
      setSummaryWorkout(snapshot);
      setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo-patch.jpg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.25]" />
      </div>
      <Header activeTab={activeTab} onTabChange={setActiveTab} userEmail={user.email} onSignOut={signOut} />
      <main className="container max-w-2xl mx-auto px-4 pt-4 relative z-10">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-6 pb-6">

          <TabsContent value="dashboard" className="mt-0 outline-none">
            <TabTransition value="dashboard" activeTab={activeTab}>
              <DashboardView
                workouts={workouts}
                selectedMember={selectedMember}
                onNavigateToHistory={() => setActiveTab('records')}
                onNavigateToWorkout={() => setActiveTab('workout')}
                onNavigateToAI={() => setActiveTab('ai')}
              />
            </TabTransition>
          </TabsContent>

          <TabsContent value="workout" className="mt-0 outline-none">
            <TabTransition value="workout" activeTab={activeTab}>
              <WorkoutView
                currentWorkout={currentWorkout}
                onStartWorkout={() => startWorkout(selectedMember?.id)}
                onAddExercise={addExercise}
                onRemoveExercise={removeExercise}
                onAddSet={addSet}
                onUpdateSet={updateSet}
                onRemoveSet={removeSet}
                onFinishWorkout={handleFinishWorkout}
                onCancelWorkout={cancelWorkout}
                customExercises={customExercises}
                workouts={workouts}
              />
            </TabTransition>
          </TabsContent>

          <TabsContent value="programs" className="mt-0 outline-none">
            <TabTransition value="programs" activeTab={activeTab}>
              <ProgramsView
                programs={programs}
                onCreateProgram={createProgram}
                onUpdateProgram={updateProgram}
                onDeleteProgram={deleteProgram}
                onStartFromProgram={(exs) => { startWorkoutFromProgram(selectedMember?.id || '', exs); setActiveTab('workout'); }}
                customExercises={customExercises}
                onAddCustomExercise={addCustomExercise}
                onDeleteCustomExercise={deleteCustomExercise}
              />
            </TabTransition>
          </TabsContent>

          <TabsContent value="ai" className="mt-0 outline-none">
            <TabTransition value="ai" activeTab={activeTab}>
              <AIWorkoutView
                onSaveAsProgram={(name, desc, days, style, limit, rounds, exs, note) => createProgram(name, desc, days, style, limit, rounds, exs, null, note)}
                onSaveMultiplePrograms={async (multi) => {
                  for (const p of multi) {
                    await createProgram(p.name, p.description, p.daysOfWeek, undefined, undefined, undefined, p.exercises, null, p.note);
                  }
                }}
                onStartWorkout={(exs) => { startWorkoutFromProgram(selectedMember?.id || '', exs); setActiveTab('workout'); }}
                recentWorkouts={workouts.slice(0, 10)}
              />
            </TabTransition>
          </TabsContent>

          <TabsContent value="records" className="mt-0 outline-none">
            <TabTransition value="records" activeTab={activeTab}>
              <RecordsTab
                workouts={workouts}
                selectedMember={selectedMember}
                onDeleteWorkout={deleteWorkout}
                onUpdateSavedSet={updateSavedSet}
              />
            </TabTransition>
          </TabsContent>

          {/* ─── 바텀 탭 5개 ─── */}
          <TabsList className="fixed bottom-0 left-0 right-0 h-[72px] pb-safe glass border-t border-white/5 grid grid-cols-5 px-1 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] bg-background/80 backdrop-blur-2xl">
            <TabsTrigger value="dashboard" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[11px] font-medium">홈</span>
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95">
              <Dumbbell className="w-5 h-5" />
              <span className="text-[11px] font-medium">운동</span>
            </TabsTrigger>
            <TabsTrigger value="programs" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95">
              <ClipboardList className="w-5 h-5" />
              <span className="text-[11px] font-medium">프로그램</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95">
              <Sparkles className="w-5 h-5" />
              <span className="text-[11px] font-medium">AI</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95">
              <BarChart2 className="w-5 h-5" />
              <span className="text-[11px] font-medium">기록</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>

      {/* ─── 운동 완료 요약 모달 ─── */}
      {summaryWorkout && (
        <WorkoutSummary
          workout={summaryWorkout}
          allWorkouts={workouts}
          onClose={() => setSummaryWorkout(null)}
        />
      )}
    </div>
  );
};

export default Index;

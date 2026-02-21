import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { ProgressView } from '@/components/ProgressView';
import { CalendarView } from '@/components/CalendarView';
import { ProgramsView } from '@/components/ProgramsView';
import { AIWorkoutView } from '@/components/AIWorkoutView';

import { useWorkoutCloud } from '@/hooks/useWorkoutCloud';
import { useWorkoutPrograms } from '@/hooks/useWorkoutPrograms';
import { useCustomExercises } from '@/hooks/useCustomExercises';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, History, LineChart, Calendar, ClipboardList, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
type TabType = 'workout' | 'programs' | 'ai' | 'history' | 'progress' | 'calendar';

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

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { members, selectedMember, setSelectedMember, addMember, updateMember, deleteMember } = useMembers();
  const { workouts, currentWorkout, startWorkout, startWorkoutFromProgram, addExercise, removeExercise, addSet, updateSet, removeSet, finishWorkout, cancelWorkout, deleteWorkout } = useWorkoutCloud({ memberId: selectedMember?.id });
  const { programs, createProgram, updateProgram, deleteProgram } = useWorkoutPrograms({ memberId: selectedMember?.id });
  const { customExercises, addCustomExercise, deleteCustomExercise } = useCustomExercises();
  const [activeTab, setActiveTab] = useState<TabType>('workout');

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
      {/* Subtle patch background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo-patch.jpg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.25]" />
      </div>
      <Header activeTab={activeTab} onTabChange={setActiveTab} userEmail={user.email} onSignOut={signOut} />
      <main className="container max-w-2xl mx-auto px-4 pt-4 relative z-10">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-6 pb-6">
          <TabsContent value="workout" className="mt-0 outline-none">
            <TabTransition value="workout" activeTab={activeTab}>
              <WorkoutView currentWorkout={currentWorkout} onStartWorkout={() => startWorkout(selectedMember?.id)} onAddExercise={addExercise} onRemoveExercise={removeExercise} onAddSet={addSet} onUpdateSet={updateSet} onRemoveSet={removeSet} onFinishWorkout={finishWorkout} onCancelWorkout={cancelWorkout} customExercises={customExercises} />
            </TabTransition>
          </TabsContent>
          <TabsContent value="programs" className="mt-0 outline-none">
            <TabTransition value="programs" activeTab={activeTab}>
              <ProgramsView programs={programs} onCreateProgram={createProgram} onUpdateProgram={updateProgram} onDeleteProgram={deleteProgram} onStartFromProgram={(exs) => { startWorkoutFromProgram(selectedMember?.id || '', exs); setActiveTab('workout'); }} customExercises={customExercises} onAddCustomExercise={addCustomExercise} onDeleteCustomExercise={deleteCustomExercise} />
            </TabTransition>
          </TabsContent>
          <TabsContent value="ai" className="mt-0 outline-none">
            <TabTransition value="ai" activeTab={activeTab}>
              <AIWorkoutView
                onSaveAsProgram={(name, desc, days, style, limit, rounds, exs) => createProgram(name, desc, days, style, limit, rounds, exs)}
                onSaveMultiplePrograms={async (multi) => {
                  for (const p of multi) {
                    await createProgram(p.name, p.description, p.daysOfWeek, undefined, undefined, undefined, p.exercises);
                  }
                }}
                onStartWorkout={(exs) => { startWorkoutFromProgram(selectedMember?.id || '', exs); setActiveTab('workout'); }}
              />
            </TabTransition>
          </TabsContent>
          <TabsContent value="history" className="mt-0 outline-none">
            <TabTransition value="history" activeTab={activeTab}>
              <HistoryView workouts={workouts} onDeleteWorkout={deleteWorkout} />
            </TabTransition>
          </TabsContent>
          <TabsContent value="progress" className="mt-0 outline-none">
            <TabTransition value="progress" activeTab={activeTab}>
              <ProgressView workouts={workouts} selectedMember={selectedMember} />
            </TabTransition>
          </TabsContent>
          <TabsContent value="calendar" className="mt-0 outline-none">
            <TabTransition value="calendar" activeTab={activeTab}>
              <CalendarView workouts={workouts} selectedMember={selectedMember} />
            </TabTransition>
          </TabsContent>

          <TabsList className="fixed bottom-0 left-0 right-0 h-[72px] pb-safe glass border-t border-white/5 grid grid-cols-6 px-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] bg-background/80 backdrop-blur-2xl">
            <TabsTrigger value="workout" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95"><Dumbbell className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-medium">운동</span></TabsTrigger>
            <TabsTrigger value="programs" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95"><ClipboardList className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-medium">프로그램</span></TabsTrigger>
            <TabsTrigger value="ai" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95"><Sparkles className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-medium">AI추천</span></TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95"><History className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-medium">기록</span></TabsTrigger>
            <TabsTrigger value="progress" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95"><LineChart className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-medium">통계</span></TabsTrigger>
            <TabsTrigger value="calendar" className="flex flex-col gap-1 data-[state=active]:text-primary data-[state=active]:bg-primary/10 rounded-xl transition-all duration-300 active:scale-95"><Calendar className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-medium">달력</span></TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

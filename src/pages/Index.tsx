import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { ProgressView } from '@/components/ProgressView';
import { CalendarView } from '@/components/CalendarView';
import { ProgramsView } from '@/components/ProgramsView';
import { AIWorkoutView } from '@/components/AIWorkoutView';
import { ProgressiveOverloadView } from '@/components/ProgressiveOverloadView';
import { MemberSelector } from '@/components/MemberSelector';
import { useWorkout } from '@/hooks/useWorkout';
import { useWorkoutPrograms } from '@/hooks/useWorkoutPrograms';
import { useCustomExercises } from '@/hooks/useCustomExercises';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, History, LineChart, Calendar, ClipboardList, Sparkles, TrendingUp } from 'lucide-react';

type TabType = 'workout' | 'programs' | 'ai' | 'overload' | 'history' | 'progress' | 'calendar';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { members, selectedMember, setSelectedMember, addMember, updateMember, deleteMember } = useMembers();
  const { workouts, currentWorkout, startWorkout, startWorkoutWithExercises, addExercise, removeExercise, addSet, updateSet, removeSet, finishWorkout, cancelWorkout, deleteWorkout } = useWorkout();
  const { programs, createProgram, updateProgram, deleteProgram } = useWorkoutPrograms({ memberId: selectedMember?.id });
  const { customExercises } = useCustomExercises();
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
    <div className="min-h-screen bg-background pb-20">
      <Header activeTab={activeTab} onTabChange={setActiveTab} userEmail={user.email} onSignOut={signOut} />
      <main className="container max-w-2xl mx-auto px-4 pt-4">
        {/* Member Selector */}
        <MemberSelector
          members={members}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          onAddMember={addMember}
          onUpdateMember={updateMember}
          onDeleteMember={deleteMember}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-6">
          <TabsContent value="workout" className="mt-0">
            <WorkoutView currentWorkout={currentWorkout} onStartWorkout={startWorkout} onAddExercise={addExercise} onRemoveExercise={removeExercise} onAddSet={addSet} onUpdateSet={updateSet} onRemoveSet={removeSet} onFinishWorkout={finishWorkout} onCancelWorkout={cancelWorkout} customExercises={customExercises} />
          </TabsContent>
          <TabsContent value="programs">
            <ProgramsView programs={programs} onCreateProgram={createProgram} onUpdateProgram={updateProgram} onDeleteProgram={deleteProgram} onStartFromProgram={(exs) => { startWorkoutWithExercises(exs); setActiveTab('workout'); }} customExercises={customExercises} />
          </TabsContent>
          <TabsContent value="ai">
            <AIWorkoutView
              onSaveAsProgram={createProgram}
              onStartWorkout={(exs) => { startWorkoutWithExercises(exs); setActiveTab('workout'); }}
            />
          </TabsContent>
          <TabsContent value="overload">
            <ProgressiveOverloadView onSaveAsProgram={createProgram} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryView workouts={workouts} onDeleteWorkout={deleteWorkout} />
          </TabsContent>
          <TabsContent value="progress">
            <ProgressView workouts={workouts} selectedMember={selectedMember} />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarView workouts={workouts} selectedMember={selectedMember} />
          </TabsContent>
          <TabsList className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t grid grid-cols-7 px-1 z-40">
            <TabsTrigger value="workout" className="flex flex-col gap-1"><Dumbbell className="w-5 h-5" /><span className="text-[10px]">운동</span></TabsTrigger>
            <TabsTrigger value="programs" className="flex flex-col gap-1"><ClipboardList className="w-5 h-5" /><span className="text-[10px]">프로그램</span></TabsTrigger>
            <TabsTrigger value="ai" className="flex flex-col gap-1"><Sparkles className="w-5 h-5" /><span className="text-[10px]">AI추천</span></TabsTrigger>
            <TabsTrigger value="overload" className="flex flex-col gap-1"><TrendingUp className="w-5 h-5" /><span className="text-[10px]">과부하</span></TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col gap-1"><History className="w-5 h-5" /><span className="text-[10px]">기록</span></TabsTrigger>
            <TabsTrigger value="progress" className="flex flex-col gap-1"><LineChart className="w-5 h-5" /><span className="text-[10px]">통계</span></TabsTrigger>
            <TabsTrigger value="calendar" className="flex flex-col gap-1"><Calendar className="w-5 h-5" /><span className="text-[10px]">달력</span></TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

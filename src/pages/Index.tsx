import { useState } from 'react';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { ProgressView } from '@/components/ProgressView';
import { CalendarView } from '@/components/CalendarView';
import { ProgramsView } from '@/components/ProgramsView';
import { useWorkout } from '@/hooks/useWorkout';
import { useWorkoutPrograms } from '@/hooks/useWorkoutPrograms';
import { useCustomExercises } from '@/hooks/useCustomExercises';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, History, LineChart, Calendar, ClipboardList } from 'lucide-react';

const Index = () => {
  const { currentWorkout, startWorkout, updateExercise, addExercise, removeExercise, addSet, updateSet, removeSet, finishWorkout, cancelWorkout } = useWorkout();
  const { programs, createProgram, updateProgram, deleteProgram } = useWorkoutPrograms();
  const { customExercises } = useCustomExercises();
  const [activeTab, setActiveTab] = useState('workout');

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container max-w-2xl mx-auto px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="workout" className="mt-0">
            <WorkoutView currentWorkout={currentWorkout} onUpdateExercise={updateExercise} onAddExercise={addExercise} onRemoveExercise={removeExercise} onAddSet={addSet} onUpdateSet={updateSet} onRemoveSet={removeSet} onFinishWorkout={finishWorkout} onCancelWorkout={cancelWorkout} customExercises={customExercises} />
          </TabsContent>
          <TabsContent value="programs">
            <ProgramsView programs={programs} onCreateProgram={createProgram} onUpdateProgram={updateProgram} onDeleteProgram={deleteProgram} onStartFromProgram={(exs) => { startWorkout(); exs.forEach((ex) => addExercise(ex.exerciseName, ex.muscleGroup)); setActiveTab('workout'); }} customExercises={customExercises} />
          </TabsContent>
          <TabsContent value="history"><HistoryView /></TabsContent>
          <TabsContent value="progress"><ProgressView /></TabsContent>
          <TabsContent value="calendar"><CalendarView /></TabsContent>
          <TabsList className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t grid grid-cols-5 px-2 z-40">
            <TabsTrigger value="workout" className="flex flex-col gap-1"><Dumbbell className="w-5 h-5" /><span className="text-[10px]">운동</span></TabsTrigger>
            <TabsTrigger value="programs" className="flex flex-col gap-1"><ClipboardList className="w-5 h-5" /><span className="text-[10px]">프로그램</span></TabsTrigger>
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

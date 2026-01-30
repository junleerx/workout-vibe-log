import { useState } from 'react';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { useWorkout } from '@/hooks/useWorkout';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'workout' | 'history'>('workout');
  const {
    workouts,
    currentWorkout,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    finishWorkout,
    cancelWorkout,
    deleteWorkout,
  } = useWorkout();

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container py-6">
        {activeTab === 'workout' ? (
          <WorkoutView
            currentWorkout={currentWorkout}
            onStartWorkout={startWorkout}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onUpdateSet={updateSet}
            onFinishWorkout={finishWorkout}
            onCancelWorkout={cancelWorkout}
          />
        ) : (
          <HistoryView workouts={workouts} onDeleteWorkout={deleteWorkout} />
        )}
      </main>
    </div>
  );
};

export default Index;

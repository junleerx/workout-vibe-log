import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { useWorkoutCloud } from '@/hooks/useWorkoutCloud';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'workout' | 'history'>('workout');
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const {
    workouts,
    currentWorkout,
    loading: workoutsLoading,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    finishWorkout,
    cancelWorkout,
    deleteWorkout,
  } = useWorkoutCloud();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || workoutsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userEmail={user.email}
        onSignOut={signOut}
      />
      
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

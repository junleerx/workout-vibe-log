import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WorkoutView } from '@/components/WorkoutView';
import { HistoryView } from '@/components/HistoryView';
import { CalendarView } from '@/components/CalendarView';
import { ProgressView } from '@/components/ProgressView';
import { MemberSelector } from '@/components/MemberSelector';
import { useWorkoutCloud } from '@/hooks/useWorkoutCloud';
import { useMembers } from '@/hooks/useMembers';
import { useCustomExercises } from '@/hooks/useCustomExercises';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type TabType = 'workout' | 'history' | 'calendar' | 'progress';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const {
    members,
    selectedMember,
    setSelectedMember,
    loading: membersLoading,
    addMember,
    updateMember,
    deleteMember,
  } = useMembers();

  const {
    customExercises,
    addCustomExercise,
  } = useCustomExercises();

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
  } = useWorkoutCloud({ memberId: selectedMember?.id });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || workoutsLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleStartWorkout = () => {
    if (!selectedMember) {
      return;
    }
    startWorkout(selectedMember.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userEmail={user.email}
        onSignOut={signOut}
      />
      
      <main className="container py-6">
        <MemberSelector
          members={members}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          onAddMember={addMember}
          onUpdateMember={updateMember}
          onDeleteMember={deleteMember}
        />

        {!selectedMember && members.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">회원을 추가해주세요</h2>
              <p className="text-muted-foreground">
                운동 기록을 시작하려면 먼저 회원을 추가해야 합니다.
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'workout' && (
              <WorkoutView
                currentWorkout={currentWorkout}
                onStartWorkout={handleStartWorkout}
                onAddExercise={addExercise}
                onRemoveExercise={removeExercise}
                onAddSet={addSet}
                onRemoveSet={removeSet}
                onUpdateSet={updateSet}
                onFinishWorkout={finishWorkout}
                onCancelWorkout={cancelWorkout}
                customExercises={customExercises}
                onAddCustomExercise={addCustomExercise}
              />
            )}
            {activeTab === 'history' && (
              <HistoryView workouts={workouts} onDeleteWorkout={deleteWorkout} />
            )}
            {activeTab === 'calendar' && (
              <CalendarView workouts={workouts} selectedMember={selectedMember} />
            )}
            {activeTab === 'progress' && (
              <ProgressView workouts={workouts} selectedMember={selectedMember} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;

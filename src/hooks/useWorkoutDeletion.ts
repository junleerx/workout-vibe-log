import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workout } from '@/types/workout';
import { DeletedWorkout, UndoState } from '@/types/deletion';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Undo2 } from 'lucide-react';

const UNDO_TIMEOUT = 8000; // 8 seconds to undo
const DELETION_RETENTION = 24 * 60 * 60 * 1000; // 24 hours

export function useWorkoutDeletion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [undoState, setUndoState] = useState<UndoState>({
    deletedWorkout: null,
    toastId: null,
    expiresAt: null,
  });

  const softDeleteWorkout = useCallback(
    async (workout: Workout): Promise<DeletedWorkout | null> => {
      if (!user) return null;

      try {
        // Store deleted workout data
        const { data, error } = await supabase
          .from('deleted_workouts')
          .insert({
            user_id: user.id,
            original_workout_id: workout.id,
            workout_data: JSON.stringify(workout),
            deleted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        const deletedWorkout: DeletedWorkout = {
          id: data.id,
          originalWorkoutId: data.original_workout_id,
          workoutData: JSON.parse(data.workout_data),
          deletedAt: data.deleted_at,
          createdAt: data.created_at,
        };

        // Update undo state
        const expiresAt = Date.now() + UNDO_TIMEOUT;
        setUndoState({
          deletedWorkout,
          toastId: null,
          expiresAt,
        });

        // Show undo toast
        const { dismiss } = toast({
          title: '운동 삭제됨',
          description: `${new Date(workout.date).toLocaleDateString('ko-KR')} 운동이 삭제되었습니다.`,
          action: {
            label: '되돌리기',
            onClick: () => undoDelete(deletedWorkout),
          },
          duration: UNDO_TIMEOUT,
        });

        // Auto-cleanup after timeout
        setTimeout(() => {
          if (undoState.deletedWorkout?.id === deletedWorkout.id) {
            setUndoState({
              deletedWorkout: null,
              toastId: null,
              expiresAt: null,
            });
          }
        }, UNDO_TIMEOUT);

        return deletedWorkout;
      } catch (error) {
        console.error('Error soft deleting workout:', error);
        toast({
          title: '오류',
          description: '운동 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        return null;
      }
    },
    [user, toast, undoState.deletedWorkout?.id]
  );

  const undoDelete = useCallback(
    async (deletedWorkout: DeletedWorkout) => {
      if (!user) return false;

      try {
        // Restore workout data to main workouts table
        const { error: insertError } = await supabase
          .from('workouts')
          .insert({
            id: deletedWorkout.originalWorkoutId,
            user_id: user.id,
            date: deletedWorkout.workoutData.date,
            duration: deletedWorkout.workoutData.duration || 0,
            member_id: deletedWorkout.workoutData.memberId,
            total_volume: 0, // Will be recalculated
            total_sets: 0,
          });

        if (insertError) throw insertError;

        // Restore exercises and sets
        for (const exercise of deletedWorkout.workoutData.exercises) {
          const { data: exData, error: exError } = await supabase
            .from('workout_exercises')
            .insert({
              workout_id: deletedWorkout.originalWorkoutId,
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              muscle_group: exercise.category,
            })
            .select()
            .single();

          if (exError) throw exError;

          // Restore sets
          if (exercise.sets.length > 0) {
            const setsData = exercise.sets.map((set, idx) => ({
              workout_exercise_id: exData.id,
              set_number: idx + 1,
              weight: set.weight,
              reps: set.reps,
              completed: set.completed,
            }));

            const { error: setError } = await supabase
              .from('exercise_sets')
              .insert(setsData);

            if (setError) throw setError;
          }
        }

        // Delete from deleted_workouts
        const { error: deleteError } = await supabase
          .from('deleted_workouts')
          .delete()
          .eq('id', deletedWorkout.id);

        if (deleteError) throw deleteError;

        // Clear undo state
        setUndoState({
          deletedWorkout: null,
          toastId: null,
          expiresAt: null,
        });

        toast({
          title: '복구 완료',
          description: '운동이 복구되었습니다.',
        });

        return true;
      } catch (error) {
        console.error('Error undoing delete:', error);
        toast({
          title: '오류',
          description: '운동을 복구하지 못했습니다.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, toast]
  );

  const permanentlyDelete = useCallback(
    async (deletionId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('deleted_workouts')
          .delete()
          .eq('id', deletionId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error permanently deleting:', error);
        return false;
      }
    },
    [user]
  );

  const clearExpiredDeletions = useCallback(async () => {
    if (!user) return;

    try {
      const cutoffTime = new Date(Date.now() - DELETION_RETENTION).toISOString();

      const { error } = await supabase
        .from('deleted_workouts')
        .delete()
        .lt('deleted_at', cutoffTime);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing expired deletions:', error);
    }
  }, [user]);

  return {
    softDeleteWorkout,
    undoDelete,
    permanentlyDelete,
    clearExpiredDeletions,
    undoState,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutProgram, ProgramExercise } from '@/types/program';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseWorkoutProgramsOptions {
  memberId?: string | null;
}

export function useWorkoutPrograms({ memberId }: UseWorkoutProgramsOptions = {}) {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPrograms = useCallback(async () => {
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('workout_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (memberId) {
        query = query.eq('member_id', memberId);
      } else {
        query = query.is('member_id', null);
      }

      const { data: programsData, error: programsError } = await query;

      if (programsError) throw programsError;

      const fullPrograms: WorkoutProgram[] = await Promise.all(
        (programsData || []).map(async (program) => {
          const { data: exercisesData } = await supabase
            .from('program_exercises')
            .select('*')
            .eq('program_id', program.id)
            .order('order_index', { ascending: true });

          return {
            id: program.id,
            name: program.name,
            description: program.description || undefined,
            daysOfWeek: program.days_of_week || [],
            workoutStyle: (program.workout_style as WorkoutProgram['workoutStyle']) || undefined,
            timeLimit: program.time_limit || undefined,
            targetRounds: program.target_rounds || undefined,
            exercises: (exercisesData || []).map((ex) => ({
              id: ex.id,
              exerciseName: ex.exercise_name,
              muscleGroup: ex.muscle_group,
              targetSets: ex.target_sets,
              targetReps: ex.target_reps,
              targetWeight: Number(ex.target_weight),
              targetDistance: ex.target_distance || undefined,
              targetTime: ex.target_time || undefined,
              groupId: ex.group_id || undefined,
              groupRounds: ex.group_rounds || undefined,
              sets: [], // Fix: Ensure sets array is present
              orderIndex: ex.order_index,
            })),
            createdAt: program.created_at,
            updatedAt: program.updated_at,
          };
        })
      );

      setPrograms(fullPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: '오류',
        description: '프로그램을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, memberId]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const createProgram = async (
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[]
  ) => {
    if (!user) return;

    try {
      const { data: programData, error: programError } = await supabase
        .from('workout_programs')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          days_of_week: daysOfWeek,
          workout_style: workoutStyle || null,
          time_limit: timeLimit || null,
          target_rounds: targetRounds || null,
          member_id: memberId || null,
        })
        .select()
        .single();

      if (programError) throw programError;

      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map((ex, index) => ({
          program_id: programData.id,
          exercise_name: ex.exerciseName,
          muscle_group: ex.muscleGroup,
          target_sets: ex.targetSets,
          target_reps: ex.targetReps,
          target_weight: ex.targetWeight,
          target_distance: ex.targetDistance || null,
          target_time: ex.targetTime || null,
          group_id: ex.groupId || null,
          group_rounds: ex.groupRounds || null,
          order_index: index,
        }));

        const { error: exercisesError } = await supabase
          .from('program_exercises')
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      toast({
        title: '완료!',
        description: '프로그램이 생성되었습니다.',
      });

      fetchPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
      toast({
        title: '오류',
        description: '프로그램 생성에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const updateProgram = async (
    programId: string,
    name: string,
    description: string,
    daysOfWeek: string[],
    workoutStyle: string | undefined,
    timeLimit: number | undefined,
    targetRounds: number | undefined,
    exercises: Omit<ProgramExercise, 'id'>[]
  ) => {
    if (!user) return;

    try {
      const { error: programError } = await supabase
        .from('workout_programs')
        .update({
          name,
          description: description || null,
          days_of_week: daysOfWeek,
          workout_style: workoutStyle || null,
          time_limit: timeLimit || null,
          target_rounds: targetRounds || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', programId);

      if (programError) throw programError;

      const { error: deleteError } = await supabase
        .from('program_exercises')
        .delete()
        .eq('program_id', programId);

      if (deleteError) throw deleteError;

      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map((ex, index) => ({
          program_id: programId,
          exercise_name: ex.exerciseName,
          muscle_group: ex.muscleGroup,
          target_sets: ex.targetSets,
          target_reps: ex.targetReps,
          target_weight: ex.targetWeight,
          target_distance: ex.targetDistance || null,
          target_time: ex.targetTime || null,
          order_index: index,
        }));

        const { error: exercisesError } = await supabase
          .from('program_exercises')
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      toast({
        title: '완료!',
        description: '프로그램이 수정되었습니다.',
      });

      fetchPrograms();
    } catch (error) {
      console.error('Error updating program:', error);
      toast({
        title: '오류',
        description: '프로그램 수정에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteProgram = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('workout_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      setPrograms(programs.filter((p) => p.id !== programId));

      toast({
        title: '삭제 완료',
        description: '프로그램이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: '오류',
        description: '프로그램 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return {
    programs,
    loading,
    createProgram,
    updateProgram,
    deleteProgram,
    refetch: fetchPrograms,
  };
}

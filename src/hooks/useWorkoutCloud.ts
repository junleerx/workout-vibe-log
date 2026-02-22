import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workout, Exercise, WorkoutSet } from '@/types/workout';
import { ProgramExercise } from '@/types/program';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseWorkoutCloudOptions {
  memberId?: string | null;
}

export function useWorkoutCloud({ memberId }: UseWorkoutCloudOptions = {}) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch workouts from database
  const fetchWorkouts = useCallback(async () => {
    if (!user || !memberId) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('workouts')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false });

      const { data: workoutsData, error: workoutsError } = await query;

      if (workoutsError) throw workoutsError;

      const fullWorkouts: Workout[] = await Promise.all(
        (workoutsData || []).map(async (workout) => {
          const { data: exercisesData } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', workout.id);

          const exercises: Exercise[] = await Promise.all(
            (exercisesData || []).map(async (ex) => {
              const { data: setsData } = await supabase
                .from('exercise_sets')
                .select('*')
                .eq('workout_exercise_id', ex.id)
                .order('set_number', { ascending: true });

              return {
                id: ex.id,
                name: ex.exercise_name,
                category: ex.muscle_group as Exercise['category'],
                sets: (setsData || []).map((s) => ({
                  id: s.id,
                  reps: s.reps,
                  weight: Number(s.weight),
                  completed: s.completed,
                })),
              };
            })
          );

          return {
            id: workout.id,
            date: workout.date,
            duration: workout.duration,
            exercises,
          };
        })
      );

      setWorkouts(fullWorkouts);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      toast({
        title: '오류',
        description: '운동 기록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, memberId]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const startWorkout = (selectedMemberId?: string) => {
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      exercises: [],
      memberId: selectedMemberId,
    };
    setCurrentWorkout(newWorkout);
  };

  const startWorkoutFromProgram = (selectedMemberId: string, exercises: { exerciseName: string; muscleGroup: string; targetSets?: number; targetReps?: number; targetWeight?: number; targetDistance?: number; targetTime?: number; groupId?: string; groupRounds?: number; groupRestTime?: number }[]) => {
    const newExercises: Exercise[] = [];

    // groupId별로 그룹핑해서 각 그룹을 groupRounds만큼 반복 확장 (서킷/크로스핏 블록 처리)
    const groups = new Map<string, typeof exercises>();
    const ungrouped: typeof exercises = [];

    for (const ex of exercises) {
      if (ex.groupId) {
        if (!groups.has(ex.groupId)) groups.set(ex.groupId, []);
        groups.get(ex.groupId)!.push(ex);
      } else {
        ungrouped.push(ex);
      }
    }

    // 순서 유지를 위해 original order로 확장
    const processedGroups = new Set<string>();
    for (const ex of exercises) {
      if (ex.groupId && !processedGroups.has(ex.groupId)) {
        processedGroups.add(ex.groupId);
        const groupExercises = groups.get(ex.groupId)!;
        const totalRounds = ex.groupRounds || 1;
        for (let round = 1; round <= totalRounds; round++) {
          for (const gex of groupExercises) {
            newExercises.push({
              id: crypto.randomUUID(),
              name: gex.exerciseName,
              category: gex.muscleGroup as Exercise['category'],
              groupId: gex.groupId,
              roundNumber: round,
              groupRounds: totalRounds,
              groupRestTime: gex.groupRestTime,
              targetDistance: gex.targetDistance,
              targetTime: gex.targetTime,
              sets: Array.from({ length: gex.targetSets || 1 }, () => ({
                id: crypto.randomUUID(),
                reps: gex.targetReps || 0,
                weight: gex.targetWeight || 0,
                completed: false,
              })),
            });
          }
        }
      } else if (!ex.groupId) {
        newExercises.push({
          id: crypto.randomUUID(),
          name: ex.exerciseName,
          category: ex.muscleGroup as Exercise['category'],
          targetDistance: ex.targetDistance,
          targetTime: ex.targetTime,
          sets: Array.from({ length: ex.targetSets || 1 }, () => ({
            id: crypto.randomUUID(),
            reps: ex.targetReps || 0,
            weight: ex.targetWeight || 0,
            completed: false,
          })),
        });
      }
    }

    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      exercises: newExercises,
      memberId: selectedMemberId,
    };

    // ─── 이전 기록 불러오기 ───
    // workouts 상태에서 같은 운동 이름의 최근 기록을 탐색
    if (workouts.length > 0) {
      const previousWeights = new Map<string, { weight: number; reps: number }[]>();
      const uniqueNames = [...new Set(newExercises.map(e => e.name))];

      for (const name of uniqueNames) {
        for (const w of workouts) {
          const match = w.exercises.find(e => e.name === name);
          if (match && match.sets.length > 0) {
            previousWeights.set(name, match.sets.map(s => ({ weight: s.weight, reps: s.reps })));
            break; // 가장 최근 것만
          }
        }
      }

      if (previousWeights.size > 0 && window.confirm('이전 운동 기록이 있습니다.\n저번 무게/횟수를 불러오시겠습니까?')) {
        for (const ex of newWorkout.exercises) {
          const prev = previousWeights.get(ex.name);
          if (prev) {
            ex.previousSets = prev.map(p => ({
              id: crypto.randomUUID(),
              weight: p.weight,
              reps: p.reps,
              completed: false,
            }));
            ex.sets = ex.sets.map((set, i) => ({
              ...set,
              weight: prev[i]?.weight ?? set.weight,
              reps: prev[i]?.reps ?? set.reps,
            }));
          }
        }
      }
    }

    setCurrentWorkout(newWorkout);
  };

  const addExercise = (name: string, category: Exercise['category']) => {
    if (!currentWorkout) return;

    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      category,
      sets: [{ id: crypto.randomUUID(), reps: 0, weight: 0, completed: false }],
    };

    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise],
    });
  };

  const removeExercise = (exerciseId: string) => {
    if (!currentWorkout) return;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter((e) => e.id !== exerciseId),
    });
  };

  const addSet = (exerciseId: string) => {
    if (!currentWorkout) return;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          const lastSet = exercise.sets[exercise.sets.length - 1];
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: crypto.randomUUID(),
                reps: lastSet?.reps || 0,
                weight: lastSet?.weight || 0,
                completed: false,
              },
            ],
          };
        }
        return exercise;
      }),
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    if (!currentWorkout) return;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.filter((s) => s.id !== setId),
          };
        }
        return exercise;
      }),
    });
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    if (!currentWorkout) return;

    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map((set) => {
              if (set.id === setId) {
                return { ...set, ...updates };
              }
              return set;
            }),
          };
        }
        return exercise;
      }),
    });
  };

  const finishWorkout = async (): Promise<boolean> => {
    if (!currentWorkout || !user) return false;

    const duration = Math.floor((Date.now() - new Date(currentWorkout.date).getTime()) / 1000);

    // Calculate totals
    let totalVolume = 0;
    let totalSets = 0;
    currentWorkout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          totalVolume += set.weight * set.reps;
          totalSets++;
        }
      });
    });

    try {
      // Insert workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          date: currentWorkout.date.split('T')[0],
          duration,
          total_volume: totalVolume,
          total_sets: totalSets,
          member_id: currentWorkout.memberId || null,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert exercises and sets
      for (const exercise of currentWorkout.exercises) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutData.id,
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            muscle_group: exercise.category,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        // Insert sets
        const setsToInsert = exercise.sets.map((set, index) => ({
          workout_exercise_id: exerciseData.id,
          set_number: index + 1,
          weight: set.weight,
          reps: set.reps,
          completed: set.completed,
        }));

        const { error: setsError } = await supabase
          .from('exercise_sets')
          .insert(setsToInsert);

        if (setsError) throw setsError;
      }

      toast({
        title: '완료!',
        description: '운동이 저장되었습니다.',
      });

      setCurrentWorkout(null);
      fetchWorkouts();
      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: '오류',
        description: '운동 저장에 실패했습니다.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      setWorkouts(workouts.filter((w) => w.id !== workoutId));

      toast({
        title: '삭제 완료',
        description: '운동 기록이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: '오류',
        description: '운동 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Update a specific set in a saved workout
  const updateSavedSet = async (setId: string, updates: { weight?: number; reps?: number }) => {
    try {
      const { error } = await supabase
        .from('exercise_sets')
        .update(updates)
        .eq('id', setId);

      if (error) throw error;

      // Optimistic local update
      setWorkouts(prev =>
        prev.map(w => ({
          ...w,
          exercises: w.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(s =>
              s.id === setId ? { ...s, ...updates } : s
            ),
          })),
        }))
      );

      toast({ title: '수정 완료', description: '세트 데이터가 수정되었습니다.' });
    } catch (error) {
      console.error('Error updating set:', error);
      toast({ title: '오류', description: '세트 수정에 실패했습니다.', variant: 'destructive' });
    }
  };

  return {
    workouts,
    currentWorkout,
    loading,
    startWorkout,
    startWorkoutFromProgram,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    finishWorkout,
    cancelWorkout,
    deleteWorkout,
    updateSavedSet,
  };
}

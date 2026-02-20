import { useState, useEffect } from 'react';
import { Workout, Exercise, WorkoutSet, ExerciseCategory } from '@/types/workout';

const STORAGE_KEY = 'gym-workouts';

export function useWorkout() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch {
        // ignore invalid saved data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  const startWorkout = () => {
    setCurrentWorkout({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      exercises: [],
    });
  };

  /** 프로그램에서 시작할 때 운동 목록을 한 번에 넣을 때 사용 */
  const startWorkoutWithExercises = (exercises: { exerciseName: string; muscleGroup: string; targetSets?: number; targetReps?: number; targetWeight?: number; targetDistance?: number; groupId?: string; groupRounds?: number }[]) => {
    const newExercises: Exercise[] = [];

    // groupId별로 그룹핑해서 각 그룹을 groupRounds만큼 반복 확장
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
              category: gex.muscleGroup as ExerciseCategory,
              groupId: gex.groupId,
              roundNumber: round,
              groupRounds: totalRounds,
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
          category: ex.muscleGroup as ExerciseCategory,
          sets: Array.from({ length: ex.targetSets || 1 }, () => ({
            id: crypto.randomUUID(),
            reps: ex.targetReps || 0,
            weight: ex.targetWeight || 0,
            completed: false,
          })),
        });
      }
    }

    setCurrentWorkout({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      exercises: newExercises,
    });
  };

  const addExercise = (name: string, category: Exercise['category']) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;
      const newExercise: Exercise = {
        id: crypto.randomUUID(),
        name,
        category,
        sets: [{ id: crypto.randomUUID(), reps: 0, weight: 0, completed: false }],
      };
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  };

  const removeExercise = (exerciseId: string) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((e) => e.id !== exerciseId),
      };
    });
  };

  const addSet = (exerciseId: string) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;
          const lastSet = exercise.sets[exercise.sets.length - 1];
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: crypto.randomUUID(),
                reps: lastSet?.reps ?? 0,
                weight: lastSet?.weight ?? 0,
                completed: false,
              },
            ],
          };
        }),
      };
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.filter((s) => s.id !== setId),
          };
        }),
      };
    });
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId ? { ...set, ...updates } : set
            ),
          };
        }),
      };
    });
  };

  const finishWorkout = () => {
    setCurrentWorkout((prev) => {
      if (!prev) return null;
      const finishedWorkout: Workout = {
        ...prev,
        duration: Math.floor((Date.now() - new Date(prev.date).getTime()) / 1000),
      };
      setWorkouts((w) => [finishedWorkout, ...w]);
      return null;
    });
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
  };

  const deleteWorkout = (workoutId: string) => {
    setWorkouts((w) => w.filter((workout) => workout.id !== workoutId));
  };

  return {
    workouts,
    currentWorkout,
    startWorkout,
    startWorkoutWithExercises,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    finishWorkout,
    cancelWorkout,
    deleteWorkout,
  };
}

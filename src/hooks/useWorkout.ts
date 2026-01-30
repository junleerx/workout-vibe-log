import { useState, useEffect } from 'react';
import { Workout, Exercise, WorkoutSet } from '@/types/workout';

const STORAGE_KEY = 'gym-workouts';

export function useWorkout() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setWorkouts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  const startWorkout = () => {
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      exercises: [],
    };
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

  const finishWorkout = () => {
    if (!currentWorkout) return;

    const finishedWorkout = {
      ...currentWorkout,
      duration: Math.floor((Date.now() - new Date(currentWorkout.date).getTime()) / 1000),
    };

    setWorkouts([finishedWorkout, ...workouts]);
    setCurrentWorkout(null);
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
  };

  const deleteWorkout = (workoutId: string) => {
    setWorkouts(workouts.filter((w) => w.id !== workoutId));
  };

  return {
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
  };
}

import { Workout } from './workout';

export interface DeletedWorkout {
  id: string;
  originalWorkoutId: string;
  workoutData: Workout;
  deletedAt: string;
  createdAt: string;
}

export interface UndoState {
  deletedWorkout: DeletedWorkout | null;
  toastId: string | null;
  expiresAt: number | null;
}

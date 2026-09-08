// Same shapes as Adapt/pages/WorkoutTracking.tsx
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets?: number;
  reps?: number;
  weight?: number;
  completed?: boolean;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  type: 'ppl' | 'fullbody' | 'brosplit' | 'custom' | 'suggested';
  description: string;
  exercises: Exercise[];
  duration?: number; // minutes
}

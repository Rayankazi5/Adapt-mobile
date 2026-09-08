export type Goal = 'cut' | 'bulk' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'supplement';

export interface UserProfile {
  name: string;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: Goal;
  activityLevel: ActivityLevel;
}

export interface GoalTargets {
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  goal: Goal;
}

// Same shape as FoodEntry in Adapt/pages/CalorieTracking.tsx
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantityG?: number;
  time: string; // "HH:MM"
  vitamin_a?: number;
  vitamin_b1?: number;
  vitamin_b2?: number;
  vitamin_b3?: number;
  vitamin_b6?: number;
  vitamin_b9?: number;
  vitamin_b12?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  vitamin_e?: number;
  vitamin_k?: number;
}

export interface MealLog {
  type: MealType;
  entries: FoodEntry[];
}

export interface WorkoutLog {
  id: string;
  name: string;
  date: string;
  durationMin: number;
  intensity: number; // 0-10
  caloriesBurned: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FastingState {
  startTime: number | null;
  goalHours: number;
}

export interface FastingPrefs {
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  sleep_time: string; // "HH:MM"
  wake_time: string; // "HH:MM"
}

export type HydroIntensity = 'none' | 'low' | 'moderate' | 'high';

export interface HydroInputs {
  tempC: number;
  humidity: number;
  intensity: HydroIntensity;
}

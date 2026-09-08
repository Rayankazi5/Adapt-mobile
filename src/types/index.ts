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

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantityG: number;
  time: string; // ISO timestamp
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

// Ported from server/trackingEngine.ts in the Adapt web app.
// Pure functions — no DB/Node dependency, safe to run on-device.
import { ActivityLevel, GoalTargets, UserProfile } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Mifflin-St Jeor Equation (assumes male; a gender field could refine this)
export function calculateTDEE(user: Pick<UserProfile, 'weightKg' | 'heightCm' | 'age' | 'activityLevel'>): number {
  const bmr = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age) + 5;
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[user.activityLevel] || 1.55));
}

export function getGoalTargets(user: UserProfile): GoalTargets {
  const tdee = calculateTDEE(user);
  let calorieTarget: number;
  let proteinPerKg: number;

  switch (user.goal) {
    case 'cut':
      calorieTarget = tdee - 500;
      proteinPerKg = 2.0;
      break;
    case 'bulk':
      calorieTarget = tdee + 400;
      proteinPerKg = 1.8;
      break;
    case 'maintain':
    default:
      calorieTarget = tdee;
      proteinPerKg = 1.8;
      break;
  }

  const proteinTarget = Math.round(user.weightKg * proteinPerKg);
  const fatCalories = Math.round(calorieTarget * 0.25);
  const fatTarget = Math.round(fatCalories / 9);
  const carbCalories = calorieTarget - (proteinTarget * 4) - fatCalories;
  const carbsTarget = Math.round(Math.max(0, carbCalories) / 4);

  return {
    tdee,
    calorieTarget,
    proteinTarget,
    carbsTarget,
    fatTarget,
    goal: user.goal,
  };
}

export interface FoodNutritionBase {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
}

export function scaleNutrition(food: FoodNutritionBase, quantityG: number) {
  const scale = quantityG / food.servingSize;
  return {
    calories: Math.round(food.calories * scale),
    protein: Math.round(food.protein * scale * 10) / 10,
    carbs: Math.round(food.carbs * scale * 10) / 10,
    fat: Math.round(food.fats * scale * 10) / 10,
  };
}

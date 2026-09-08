// Async, on-device port of the web app's lib/dataService.ts.
// localStorage -> AsyncStorage means every call here is async, unlike the
// web version. There is no server sync path — this app is local-first only.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyTotals, FoodEntry, MealLog, MealType, WorkoutLog } from '../types';

const STORAGE_KEYS = {
  FOOD_LOGS: 'adapt_food_logs',
  WORKOUT_LOGS: 'adapt_workout_logs',
  HYDRATION: 'adapt_hydration',
};

const DEFAULT_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'supplement'];

export const getTodayKey = () => new Date().toISOString().split('T')[0];

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const dataService = {
  async getFoodLogs(date: string = getTodayKey()): Promise<MealLog[]> {
    const allLogs = await readJSON<Record<string, MealLog[]>>(STORAGE_KEYS.FOOD_LOGS, {});
    return allLogs[date] || DEFAULT_MEAL_TYPES.map((type) => ({ type, entries: [] }));
  },

  async saveFoodLogs(logs: MealLog[], date: string = getTodayKey()): Promise<void> {
    const allLogs = await readJSON<Record<string, MealLog[]>>(STORAGE_KEYS.FOOD_LOGS, {});
    allLogs[date] = logs;
    await AsyncStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(allLogs));
  },

  async addFoodEntry(mealType: MealType, entry: FoodEntry, date: string = getTodayKey()): Promise<MealLog[]> {
    const logs = await dataService.getFoodLogs(date);
    const next = logs.map((log) =>
      log.type === mealType ? { ...log, entries: [...log.entries, entry] } : log
    );
    await dataService.saveFoodLogs(next, date);
    return next;
  },

  async removeFoodEntry(mealType: MealType, entryId: string, date: string = getTodayKey()): Promise<MealLog[]> {
    const logs = await dataService.getFoodLogs(date);
    const next = logs.map((log) =>
      log.type === mealType ? { ...log, entries: log.entries.filter((e) => e.id !== entryId) } : log
    );
    await dataService.saveFoodLogs(next, date);
    return next;
  },

  async getWorkoutLogs(date: string = getTodayKey()): Promise<WorkoutLog[]> {
    const allLogs = await readJSON<Record<string, WorkoutLog[]>>(STORAGE_KEYS.WORKOUT_LOGS, {});
    return allLogs[date] || [];
  },

  async addWorkoutLog(log: Omit<WorkoutLog, 'id' | 'date'>, date: string = getTodayKey()): Promise<WorkoutLog[]> {
    const allLogs = await readJSON<Record<string, WorkoutLog[]>>(STORAGE_KEYS.WORKOUT_LOGS, {});
    if (!allLogs[date]) allLogs[date] = [];
    const entry: WorkoutLog = { ...log, id: `${Date.now()}`, date };
    allLogs[date].push(entry);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(allLogs));
    return allLogs[date];
  },

  async getHydration(date: string = getTodayKey()): Promise<{ consumed: number; goal: number }> {
    const data = await readJSON<{ consumed: number; goal: number; date: string } | null>(STORAGE_KEYS.HYDRATION, null);
    if (!data || data.date !== date) return { consumed: 0, goal: data?.goal ?? 8 };
    return { consumed: data.consumed ?? 0, goal: data.goal ?? 8 };
  },

  async saveHydration(consumed: number, goal: number, date: string = getTodayKey()): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify({ consumed, goal, date }));
  },

  // Fraction (0-1) of the day's meals logged so far, used to scale fatigue targets.
  async getMealProgress(date: string = getTodayKey()): Promise<number> {
    const logs = await dataService.getFoodLogs(date);
    const WEIGHTS: Partial<Record<MealType, number>> = {
      breakfast: 0.25,
      lunch: 0.5,
      dinner: 0.8,
      dessert: 1.0,
    };
    return logs.reduce((max, log) => {
      const w = WEIGHTS[log.type] ?? 0;
      return log.entries.length > 0 ? Math.max(max, w) : max;
    }, 0);
  },

  async getDailyTotals(date: string = getTodayKey()): Promise<DailyTotals> {
    const logs = await dataService.getFoodLogs(date);
    const totals = logs.reduce(
      (acc, log) => {
        log.entries.forEach((e) => {
          acc.calories += e.calories;
          acc.protein += e.protein;
          acc.carbs += e.carbs;
          acc.fat += e.fats;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 } as DailyTotals
    );
    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    };
  },
};

// Mirrors Adapt/pages/CalorieTracking.tsx.
import { useFocusEffect } from '@react-navigation/native';
import { Coffee, IceCream, Moon, Pill, Sun } from 'lucide-react-native';
import React, { ComponentType, useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AbsorptionTracker } from '../components/calories/AbsorptionTracker';
import { AddFoodDialog } from '../components/calories/AddFoodDialog';
import { FastingTracker } from '../components/calories/FastingTracker';
import { HydrationTracker } from '../components/calories/HydrationTracker';
import { MacroTracker } from '../components/calories/MacroTracker';
import { VitaminTracker } from '../components/calories/VitaminTracker';
import { FatigueCard } from '../components/FatigueCard';
import { FoodLogCard } from '../components/FoodLogCard';
import { Tabs } from '../components/Tabs';
import { calculateFatigueScore } from '../engines/fatigueEngine';
import { dataService } from '../services/dataService';
import { profileService } from '../services/profileService';
import { FoodEntry, GoalTargets, MealLog, MealType } from '../types';

type IconType = ComponentType<{ size?: number; color?: string }>;

const MEAL_ICONS: Record<MealType, IconType> = { breakfast: Coffee, lunch: Sun, dinner: Moon, dessert: IceCream, supplement: Pill };
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  supplement: 'Supplements',
};
const MEAL_WEIGHTS: Partial<Record<MealType, number>> = { breakfast: 0.25, lunch: 0.5, dinner: 0.8, dessert: 1.0 };
const safe = (n: number) => (Number.isFinite(n) ? n : 0);

export function LogMealScreen() {
  const [tab, setTab] = useState<'today' | 'absorption'>('today');
  const [foodLogs, setFoodLogs] = useState<MealLog[]>([]);
  const [hydration, setHydration] = useState({ consumed: 0, goal: 8 });
  const [workoutCount, setWorkoutCount] = useState(0);
  const [targets, setTargets] = useState<GoalTargets | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);

  const syncSideData = useCallback(async () => {
    const [h, workouts] = await Promise.all([dataService.getHydration(), dataService.getWorkoutLogs()]);
    setHydration(h);
    setWorkoutCount(workouts.length);
  }, []);

  const load = useCallback(async () => {
    const [logs, profile, goalTargets] = await Promise.all([
      dataService.getFoodLogs(),
      profileService.getProfile(),
      profileService.getTargets(),
    ]);
    setFoodLogs(logs);
    setHasProfile(!!profile);
    setTargets(goalTargets);
    await syncSideData();
  }, [syncSideData]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Totals and meal progress from the live foodLogs state
  const { totals, mealProgress } = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let progress = 0;
    for (const meal of foodLogs) {
      for (const e of meal.entries) {
        calories += safe(e.calories);
        protein += safe(e.protein);
      }
      const w = MEAL_WEIGHTS[meal.type] ?? 0;
      if (meal.entries.length > 0) progress = Math.max(progress, w);
    }
    return { totals: { calories, protein }, mealProgress: progress };
  }, [foodLogs]);

  // Live fatigue — workout factor only applies once a workout is completed
  const localFatigue = useMemo(
    () =>
      calculateFatigueScore({
        calorieIntake: totals.calories,
        calorieTarget: targets?.calorieTarget ?? 2000,
        proteinIntake: totals.protein,
        proteinTarget: targets?.proteinTarget ?? 150,
        hydrationConsumed: hydration.consumed,
        hydrationTarget: hydration.goal,
        workoutsCompleted: workoutCount,
        mealProgress,
      }),
    [totals, targets, hydration, workoutCount, mealProgress]
  );

  const handleAddFood = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setIsAddFoodOpen(true);
  };

  const setAndSaveLogs = (updated: MealLog[]) => {
    setFoodLogs(updated);
    dataService.saveFoodLogs(updated);
  };

  const handleFoodAdded = (food: Omit<FoodEntry, 'id'>) => {
    if (!selectedMealType) return;
    const newEntry: FoodEntry = { ...food, id: Date.now().toString() };
    setAndSaveLogs(foodLogs.map((log) => (log.type === selectedMealType ? { ...log, entries: [...log.entries, newEntry] } : log)));
    setIsAddFoodOpen(false);
    setSelectedMealType(null);
  };

  const handleDeleteFood = (mealType: MealType, foodId: string) => {
    setAndSaveLogs(foodLogs.map((log) => (log.type === mealType ? { ...log, entries: log.entries.filter((e) => e.id !== foodId) } : log)));
  };

  return (
    <ScrollView className="bg-background" contentContainerClassName="grow gap-6 px-4 pb-8 pt-16">
      <View>
        <Text className="text-3xl font-bold text-foreground">Calorie Tracking</Text>
        <Text className="text-muted-foreground">Track your meals, macros, and absorption</Text>
      </View>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'today', label: 'Today' },
          { value: 'absorption', label: 'Absorption Analysis' },
        ]}
      />

      {tab === 'today' ? (
        <View className="gap-6">
          <FastingTracker />
          <HydrationTracker onChange={syncSideData} />
          <MacroTracker foodLogs={foodLogs} />
          <VitaminTracker foodLogs={foodLogs} />

          <View className="gap-4">
            <Text className="text-xl font-semibold text-foreground">Food Logs</Text>
            {foodLogs.map((mealLog) => (
              <FoodLogCard
                key={mealLog.type}
                label={MEAL_LABELS[mealLog.type]}
                Icon={MEAL_ICONS[mealLog.type]}
                entries={mealLog.entries}
                onAddFood={() => handleAddFood(mealLog.type)}
                onDeleteFood={(foodId) => handleDeleteFood(mealLog.type, foodId)}
              />
            ))}
          </View>

          {hasProfile && <FatigueCard fatigue={localFatigue} />}
        </View>
      ) : (
        <AbsorptionTracker foodLogs={foodLogs} />
      )}

      <AddFoodDialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen} onFoodAdded={handleFoodAdded} mealType={selectedMealType} />
    </ScrollView>
  );
}

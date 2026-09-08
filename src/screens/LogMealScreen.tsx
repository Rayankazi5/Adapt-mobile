import { useFocusEffect } from '@react-navigation/native';
import { Coffee, IceCream, Moon, Pill, Sun } from 'lucide-react-native';
import React, { ComponentType, useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AddFoodModal } from '../components/AddFoodModal';
import { FatigueCard } from '../components/FatigueCard';
import { FoodLogCard } from '../components/FoodLogCard';
import { calculateFatigueScore } from '../engines/fatigueEngine';
import { dataService } from '../services/dataService';
import { profileService } from '../services/profileService';
import { FoodEntry, MealLog, MealType } from '../types';

type IconType = ComponentType<{ size?: number; color?: string }>;

const MEAL_ICONS: Record<MealType, IconType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  dessert: IceCream,
  supplement: Pill,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  supplement: 'Supplements',
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'supplement'];

export function LogMealScreen() {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [fatigue, setFatigue] = useState<ReturnType<typeof calculateFatigueScore> | null>(null);

  const load = useCallback(async () => {
    const [foodLogs, profile, targets, hydration, workouts, mealProgress] = await Promise.all([
      dataService.getFoodLogs(),
      profileService.getProfile(),
      profileService.getTargets(),
      dataService.getHydration(),
      dataService.getWorkoutLogs(),
      dataService.getMealProgress(),
    ]);
    setLogs(foodLogs);
    setHasProfile(!!profile);

    if (targets) {
      const totals = foodLogs.reduce(
        (acc, log) => {
          log.entries.forEach((e) => {
            acc.calories += e.calories;
            acc.protein += e.protein;
          });
          return acc;
        },
        { calories: 0, protein: 0 }
      );
      setFatigue(
        calculateFatigueScore({
          calorieIntake: totals.calories,
          calorieTarget: targets.calorieTarget,
          proteinIntake: totals.protein,
          proteinTarget: targets.proteinTarget,
          hydrationConsumed: hydration.consumed,
          hydrationTarget: hydration.goal,
          workoutsCompleted: workouts.length,
          mealProgress,
        })
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async (entry: FoodEntry) => {
    if (!activeMealType) return;
    const next = await dataService.addFoodEntry(activeMealType, entry);
    setLogs(next);
    setActiveMealType(null);
    load();
  };

  const handleRemove = async (mealType: MealType, entryId: string) => {
    const next = await dataService.removeFoodEntry(mealType, entryId);
    setLogs(next);
    load();
  };

  return (
    <ScrollView className="bg-background" contentContainerClassName="grow gap-4 px-4 pb-8 pt-16">
      <View>
        <Text className="text-3xl font-bold text-foreground">Calorie Tracking</Text>
        <Text className="text-muted-foreground">Track your meals and macros</Text>
      </View>

      {MEAL_ORDER.map((type) => {
        const log = logs.find((l) => l.type === type);
        return (
          <FoodLogCard
            key={type}
            label={MEAL_LABELS[type]}
            Icon={MEAL_ICONS[type]}
            entries={log?.entries ?? []}
            onAddFood={() => setActiveMealType(type)}
            onDeleteFood={(id) => handleRemove(type, id)}
          />
        );
      })}

      {hasProfile && fatigue && <FatigueCard fatigue={fatigue} />}

      <AddFoodModal
        visible={activeMealType !== null}
        mealType={activeMealType}
        mealLabel={activeMealType ? MEAL_LABELS[activeMealType] : ''}
        onClose={() => setActiveMealType(null)}
        onAdd={handleAdd}
      />
    </ScrollView>
  );
}

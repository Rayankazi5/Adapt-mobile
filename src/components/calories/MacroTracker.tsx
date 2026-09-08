// Mirrors Adapt/components/calories/MacroTracker.tsx (including its own
// weight/activity settings, which are independent of the profile targets).
import { Settings } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../theme/useTheme';
import { MealLog } from '../../types';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card';
import { SelectChips } from '../SelectChips';

type Activity = 'sedentary' | 'moderate' | 'active';

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (little exercise)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
];

export function MacroTracker({ foodLogs }: { foodLogs: MealLog[] }) {
  const { colors } = useTheme();
  const [userWeight, setUserWeight] = useState(75);
  const [activityLevel, setActivityLevel] = useState<Activity>('moderate');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const proteinTarget = Math.round(userWeight * 2);
  const fatsTarget = Math.round(userWeight * 0.9);
  const activityMultipliers: Record<Activity, number> = { sedentary: 1.2, moderate: 1.5, active: 1.8 };
  const totalCalorieTarget = Math.round(userWeight * 24 * activityMultipliers[activityLevel]);
  const carbsTarget = Math.round((totalCalorieTarget - proteinTarget * 4 - fatsTarget * 9) / 4);

  const consumed = foodLogs.reduce(
    (acc, log) => {
      log.entries.forEach((e) => {
        acc.calories += e.calories;
        acc.protein += e.protein;
        acc.carbs += e.carbs;
        acc.fats += e.fats;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage < 70) return 'bg-yellow-500';
    if (percentage > 110) return 'bg-red-500';
    return 'bg-green-500';
  };

  const pctOfCal = (macroGrams: number, kcalPerG: number) =>
    consumed.calories > 0 ? (((macroGrams * kcalPerG) / consumed.calories) * 100).toFixed(0) : '0';

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <View>
          <CardTitle>Macro Tracker</CardTitle>
          <CardDescription>Based on your weight: {userWeight}kg</CardDescription>
        </View>
        <Button variant="outline" size="sm" onPress={() => setSettingsOpen(true)} icon={<Settings size={16} color={colors.foreground} />}>
          Settings
        </Button>
      </CardHeader>
      <CardContent>
        <View className="flex-row gap-3">
          <Pillar label="Calories" sub={`${consumed.calories} / ${totalCalorieTarget}`} pct={(consumed.calories / totalCalorieTarget) * 100}
            color={getProgressColor(consumed.calories, totalCalorieTarget)}
            footer={totalCalorieTarget - consumed.calories > 0 ? `${totalCalorieTarget - consumed.calories} left` : `${consumed.calories - totalCalorieTarget} over`} />
          <Pillar label="Protein" sub={`${consumed.protein}g / ${proteinTarget}g`} pct={(consumed.protein / proteinTarget) * 100}
            color={getProgressColor(consumed.protein, proteinTarget)} footer={`${pctOfCal(consumed.protein, 4)}% of cal`} />
          <Pillar label="Carbs" sub={`${consumed.carbs}g / ${carbsTarget}g`} pct={(consumed.carbs / carbsTarget) * 100}
            color={getProgressColor(consumed.carbs, carbsTarget)} footer={`${pctOfCal(consumed.carbs, 4)}% of cal`} />
          <Pillar label="Fats" sub={`${consumed.fats}g / ${fatsTarget}g`} pct={(consumed.fats / fatsTarget) * 100}
            color={getProgressColor(consumed.fats, fatsTarget)} footer={`${pctOfCal(consumed.fats, 9)}% of cal`} />
        </View>
      </CardContent>

      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={() => setSettingsOpen(false)}>
          <Pressable className="w-full gap-4 rounded-xl border border-border bg-card p-5" onPress={() => {}}>
            <View>
              <Text className="text-lg font-semibold text-foreground">Macro Settings</Text>
              <Text className="text-sm text-muted-foreground">Adjust your weight and activity level to calculate recommended macros</Text>
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Weight (kg)</Text>
              <TextInput
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                keyboardType="number-pad"
                value={String(userWeight)}
                onChangeText={(t) => setUserWeight(Number(t) || 0)}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Activity Level</Text>
              <SelectChips size="sm" value={activityLevel} options={ACTIVITY_OPTIONS} onChange={setActivityLevel} />
            </View>
            <View className="gap-2 border-t border-border pt-4">
              <Text className="text-sm font-medium text-foreground">Recommended Daily Targets:</Text>
              <TargetRow label="Calories:" value={`${totalCalorieTarget} kcal`} />
              <TargetRow label="Protein:" value={`${proteinTarget}g`} />
              <TargetRow label="Carbs:" value={`${carbsTarget}g`} />
              <TargetRow label="Fats:" value={`${fatsTarget}g`} />
            </View>
            <Button onPress={() => setSettingsOpen(false)}>Done</Button>
          </Pressable>
        </Pressable>
      </Modal>
    </Card>
  );
}

function Pillar({ label, sub, pct, color, footer }: { label: string; sub: string; pct: number; color: string; footer: string }) {
  const height = Number.isFinite(pct) ? Math.min(pct, 100) : 0;
  return (
    <View className="flex-1 items-center gap-3">
      <View className="items-center">
        <Text className="mb-1 text-sm font-medium text-foreground">{label}</Text>
        <Text className="text-center text-xs text-muted-foreground">{sub}</Text>
      </View>
      <View className="h-64 w-12 justify-end overflow-hidden rounded-full bg-secondary">
        <View className={cn('w-full', color)} style={{ height: `${height}%` }} />
      </View>
      <Text className="text-center text-xs text-muted-foreground">{footer}</Text>
    </View>
  );
}

function TargetRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

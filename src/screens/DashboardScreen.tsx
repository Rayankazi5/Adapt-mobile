import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dumbbell, Flame, Star } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Card, CardContent, CardHeader, CardTitleRow } from '../components/Card';
import { FatigueCard } from '../components/FatigueCard';
import { MacroBar } from '../components/MacroBar';
import { StatCard } from '../components/StatCard';
import { calculateFatigueScore, FatigueResult } from '../engines/fatigueEngine';
import { RootStackParamList } from '../navigation/types';
import { dataService } from '../services/dataService';
import { profileService } from '../services/profileService';
import { useTheme } from '../theme/useTheme';
import { DailyTotals, GoalTargets } from '../types';

export function DashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [totals, setTotals] = useState<DailyTotals | null>(null);
  const [targets, setTargets] = useState<GoalTargets | null>(null);
  const [fatigue, setFatigue] = useState<FatigueResult | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const load = useCallback(async () => {
    const profile = await profileService.getProfile();
    if (!profile) {
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      return;
    }
    setHasProfile(true);
    const goalTargets = await profileService.getTargets();
    const dailyTotals = await dataService.getDailyTotals();
    const hydration = await dataService.getHydration();
    const workouts = await dataService.getWorkoutLogs();
    const mealProgress = await dataService.getMealProgress();

    setTargets(goalTargets);
    setTotals(dailyTotals);
    setWorkoutCount(workouts.length);
    setCaloriesBurned(workouts.reduce((sum, w) => sum + w.caloriesBurned, 0));

    if (goalTargets) {
      setFatigue(
        calculateFatigueScore({
          calorieIntake: dailyTotals.calories,
          calorieTarget: goalTargets.calorieTarget,
          proteinIntake: dailyTotals.protein,
          proteinTarget: goalTargets.proteinTarget,
          hydrationConsumed: hydration.consumed,
          hydrationTarget: hydration.goal,
          workoutsCompleted: workouts.length,
          mealProgress,
        })
      );
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!totals || !targets) {
    return <View className="flex-1 bg-background" />;
  }

  const remaining = Math.max(0, targets.calorieTarget - totals.calories);

  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="grow gap-4 px-4 pb-8 pt-16"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />}
    >
      <View>
        <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
        <Text className="text-muted-foreground">Your daily fitness overview</Text>
      </View>

      <View className="flex-row gap-3">
        <StatCard
          label="Calories"
          value={`${totals.calories}`}
          suffix={`/ ${targets.calorieTarget}`}
          caption={remaining > 0 ? `${remaining} kcal remaining` : '🎯 Target reached!'}
          Icon={Flame}
          tint="orange"
          progressPct={(totals.calories / targets.calorieTarget) * 100}
        />
        <StatCard
          label="Workouts"
          value={`${workoutCount}`}
          suffix="/ 1"
          caption={`${caloriesBurned} kcal burned`}
          Icon={Dumbbell}
          tint="green"
          progressPct={workoutCount * 100}
        />
      </View>

      <Card>
        <CardHeader>
          <CardTitleRow>
            <Star size={16} color="#eab308" />
            <Text className="text-base font-medium text-foreground">Today's Macros</Text>
          </CardTitleRow>
        </CardHeader>
        <CardContent className="gap-4">
          <MacroBar label="Protein" value={totals.protein} target={targets.proteinTarget} color="blue" />
          <MacroBar label="Carbs" value={totals.carbs} target={targets.carbsTarget} color="green" />
          <MacroBar label="Fats" value={totals.fat} target={targets.fatTarget} color="yellow" />
        </CardContent>
      </Card>

      {hasProfile && fatigue && <FatigueCard fatigue={fatigue} />}
    </ScrollView>
  );
}

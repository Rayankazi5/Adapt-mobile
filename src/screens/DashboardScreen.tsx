import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { calculateFatigueScore, FatigueResult } from '../engines/fatigueEngine';
import { RootStackParamList } from '../navigation/types';
import { dataService } from '../services/dataService';
import { profileService } from '../services/profileService';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';
import { DailyTotals, GoalTargets } from '../types';

export function DashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [totals, setTotals] = useState<DailyTotals | null>(null);
  const [targets, setTargets] = useState<GoalTargets | null>(null);
  const [fatigue, setFatigue] = useState<FatigueResult | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const profile = await profileService.getProfile();
    if (!profile) {
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      return;
    }
    const goalTargets = await profileService.getTargets();
    const dailyTotals = await dataService.getDailyTotals();
    const hydration = await dataService.getHydration();
    const workouts = await dataService.getWorkoutLogs();
    const mealProgress = await dataService.getMealProgress();

    setTargets(goalTargets);
    setTotals(dailyTotals);
    setWorkoutCount(workouts.length);

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
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const remaining = targets.calorieTarget - totals.calories;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>Today</Text>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Calories</Text>
        <Text style={[styles.bigNumber, { color: colors.primary }]}>{totals.calories}</Text>
        <Text style={{ color: colors.mutedForeground, marginBottom: spacing.sm }}>
          {remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over target`} · target {targets.calorieTarget}
        </Text>
        <ProgressBar label="Calories" value={totals.calories} target={targets.calorieTarget} unit="kcal" />
        <ProgressBar label="Protein" value={totals.protein} target={targets.proteinTarget} unit="g" />
        <ProgressBar label="Carbs" value={totals.carbs} target={targets.carbsTarget} unit="g" />
        <ProgressBar label="Fat" value={totals.fat} target={targets.fatTarget} unit="g" />
      </Card>

      {fatigue && (
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.fatigueHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Recovery Score</Text>
            <Text style={[styles.bigNumber, { color: fatigueColor(fatigue.fatigue_score, colors) }]}>
              {fatigue.fatigue_score}
            </Text>
          </View>
          <Text style={{ color: colors.mutedForeground }}>{fatigue.recovery_recommendation}</Text>
        </Card>
      )}

      <Card>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Today's Workouts</Text>
        <Text style={{ color: colors.mutedForeground }}>
          {workoutCount === 0 ? 'No workouts logged yet.' : `${workoutCount} workout${workoutCount > 1 ? 's' : ''} logged.`}
        </Text>
      </Card>
    </ScrollView>
  );
}

function fatigueColor(score: number, colors: { primary: string; destructive: string }) {
  if (score <= 30) return colors.primary;
  if (score <= 70) return '#D97706';
  return colors.destructive;
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, flexGrow: 1 },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: spacing.xs },
  bigNumber: { fontSize: 32, fontWeight: '700' },
  fatigueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
});

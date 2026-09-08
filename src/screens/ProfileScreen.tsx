import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RootStackParamList } from '../navigation/types';
import { profileService } from '../services/profileService';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';
import { GoalTargets, UserProfile } from '../types';

export function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [targets, setTargets] = useState<GoalTargets | null>(null);

  const load = useCallback(async () => {
    setProfile(await profileService.getProfile());
    setTargets(await profileService.getTargets());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleReset = async () => {
    await profileService.clearProfile();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  if (!profile || !targets) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.heading, { color: colors.foreground }]}>{profile.name}</Text>

      <Card style={{ marginBottom: spacing.md }}>
        <Row label="Age" value={`${profile.age}`} colors={colors} />
        <Row label="Weight" value={`${profile.weightKg} kg`} colors={colors} />
        <Row label="Height" value={`${profile.heightCm} cm`} colors={colors} />
        <Row label="Goal" value={profile.goal} colors={colors} />
        <Row label="Activity" value={profile.activityLevel.replace('_', ' ')} colors={colors} last />
      </Card>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Daily Targets</Text>
        <Row label="TDEE" value={`${targets.tdee} kcal`} colors={colors} />
        <Row label="Calories" value={`${targets.calorieTarget} kcal`} colors={colors} />
        <Row label="Protein" value={`${targets.proteinTarget} g`} colors={colors} />
        <Row label="Carbs" value={`${targets.carbsTarget} g`} colors={colors} />
        <Row label="Fat" value={`${targets.fatTarget} g`} colors={colors} last />
      </Card>

      <Button variant="destructive" onPress={handleReset}>
        Reset Profile
      </Button>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  colors,
  last,
}: {
  label: string;
  value: string;
  colors: { foreground: string; mutedForeground: string; border: string };
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Text style={{ color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontWeight: '600', textTransform: 'capitalize' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, flexGrow: 1 },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
});

import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { dataService } from '../services/dataService';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';
import { WorkoutLog } from '../types';

export function WorkoutScreen() {
  const { colors } = useTheme();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('5');
  const [calories, setCalories] = useState('');

  const load = useCallback(async () => {
    setWorkouts(await dataService.getWorkoutLogs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const canSubmit = name.trim().length > 0 && Number(duration) > 0;

  const handleAdd = async () => {
    if (!canSubmit) return;
    const next = await dataService.addWorkoutLog({
      name: name.trim(),
      durationMin: Number(duration),
      intensity: Math.min(10, Math.max(0, Number(intensity) || 0)),
      caloriesBurned: Number(calories) || 0,
    });
    setWorkouts(next);
    setName('');
    setDuration('');
    setIntensity('5');
    setCalories('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Log a Workout</Text>

      <Card style={{ marginBottom: spacing.md }}>
        <Field label="Workout name" value={name} onChangeText={setName} placeholder="Leg day" colors={colors} />
        <Field label="Duration (min)" value={duration} onChangeText={setDuration} placeholder="45" keyboardType="number-pad" colors={colors} />
        <Field label="Intensity (0-10)" value={intensity} onChangeText={setIntensity} placeholder="5" keyboardType="number-pad" colors={colors} />
        <Field label="Calories burned (optional)" value={calories} onChangeText={setCalories} placeholder="300" keyboardType="number-pad" colors={colors} />
        <Button onPress={handleAdd} disabled={!canSubmit}>
          Save Workout
        </Button>
      </Card>

      <Text style={[styles.subheading, { color: colors.foreground }]}>Today's Workouts</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: colors.mutedForeground, marginTop: spacing.sm }}>No workouts logged yet.</Text>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              {item.durationMin} min · intensity {item.intensity}/10
              {item.caloriesBurned > 0 ? ` · ${item.caloriesBurned} kcal burned` : ''}
            </Text>
          </Card>
        )}
      />
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  colors: { foreground: string; border: string; background: string; mutedForeground: string };
}) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={{ color: props.colors.foreground, fontWeight: '600', marginBottom: 4, fontSize: 13 }}>
        {props.label}
      </Text>
      <TextInput
        style={[
          styles.input,
          { color: props.colors.foreground, borderColor: props.colors.border, backgroundColor: props.colors.background },
        ]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={props.colors.mutedForeground}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: spacing.md },
  subheading: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
});

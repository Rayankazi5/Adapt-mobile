import { useFocusEffect } from '@react-navigation/native';
import { Dumbbell } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitleRow } from '../components/Card';
import { dataService } from '../services/dataService';
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
    <ScrollView className="bg-background" contentContainerClassName="grow gap-4 px-4 pb-8 pt-16">
      <View>
        <Text className="text-3xl font-bold text-foreground">Workout Tracking</Text>
        <Text className="text-muted-foreground">Log your training sessions</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitleRow>
            <Dumbbell size={20} color={colors.foreground} />
            <Text className="text-base font-medium text-foreground">Log a Workout</Text>
          </CardTitleRow>
        </CardHeader>
        <CardContent className="gap-3">
          <Field label="Workout name" value={name} onChangeText={setName} placeholder="Leg day" />
          <Field label="Duration (min)" value={duration} onChangeText={setDuration} placeholder="45" keyboardType="number-pad" />
          <Field label="Intensity (0-10)" value={intensity} onChangeText={setIntensity} placeholder="5" keyboardType="number-pad" />
          <Field label="Calories burned (optional)" value={calories} onChangeText={setCalories} placeholder="300" keyboardType="number-pad" />
          <Button onPress={handleAdd} disabled={!canSubmit}>
            Save Workout
          </Button>
        </CardContent>
      </Card>

      <View>
        <Text className="mb-2 text-xl font-semibold text-foreground">Today's Workouts</Text>
        {workouts.length === 0 ? (
          <Text className="text-muted-foreground">No workouts logged yet.</Text>
        ) : (
          <View className="gap-2">
            {workouts.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <Text className="font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.durationMin} min · intensity {item.intensity}/10
                    {item.caloriesBurned > 0 ? ` · ${item.caloriesBurned} kcal burned` : ''}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  const { colors } = useTheme();
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-foreground">{props.label}</Text>
      <TextInput
        className="rounded-[10px] border border-border bg-background px-4 py-2.5 text-base text-foreground"
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
  );
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { cn } from '../lib/cn';
import { RootStackParamList } from '../navigation/types';
import { profileService } from '../services/profileService';
import { useTheme } from '../theme/useTheme';
import { ActivityLevel, Goal, UserProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const GOALS: { key: Goal; label: string }[] = [
  { key: 'cut', label: 'Cut' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'bulk', label: 'Bulk' },
];

const ACTIVITY_LEVELS: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'light', label: 'Light' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'active', label: 'Active' },
  { key: 'very_active', label: 'Very Active' },
];

export function OnboardingScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && Number(age) > 0 && Number(weight) > 0 && Number(height) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Fill in all fields with valid numbers.');
      return;
    }
    setError(null);
    setSaving(true);
    const profile: UserProfile = {
      name: name.trim(),
      age: Number(age),
      weightKg: Number(weight),
      heightCm: Number(height),
      goal,
      activityLevel,
    };
    await profileService.saveProfile(profile);
    setSaving(false);
    navigation.replace('Main');
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerClassName="px-6 pb-8 pt-16">
        <Text className="mb-1 text-[28px] font-bold text-foreground">Welcome to Adapt</Text>
        <Text className="mb-6 text-[15px] text-muted-foreground">
          Tell us about yourself so we can set your calorie and macro targets.
        </Text>

        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="number-pad" />
        <Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" />
        <Field label="Height (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="decimal-pad" />

        <Text className="mb-1 text-sm font-semibold text-foreground">Goal</Text>
        <View className="mb-4 flex-row gap-2">
          {GOALS.map((g) => (
            <Chip key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(g.key)} />
          ))}
        </View>

        <Text className="mb-1 text-sm font-semibold text-foreground">Activity Level</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {ACTIVITY_LEVELS.map((a) => (
            <Chip
              key={a.key}
              label={a.label}
              selected={activityLevel === a.key}
              onPress={() => setActivityLevel(a.key)}
            />
          ))}
        </View>

        {error && <Text className="mb-2 text-destructive">{error}</Text>}

        <View className="mt-6">
          <Button onPress={handleSubmit} loading={saving}>
            Get Started
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}) {
  const { colors } = useTheme();
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-foreground">{props.label}</Text>
      <TextInput
        className="rounded-[10px] border border-border bg-card px-4 py-2.5 text-base text-foreground"
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      className={cn(
        'overflow-hidden rounded-full px-4 py-2 text-[13px] font-semibold',
        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
      )}
    >
      {label}
    </Text>
  );
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { RootStackParamList } from '../navigation/types';
import { profileService } from '../services/profileService';
import { spacing } from '../theme/colors';
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
  const { colors } = useTheme();
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to Adapt</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tell us about yourself so we can set your calorie and macro targets.
        </Text>

        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="number-pad" />
        <Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" />
        <Field label="Height (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="decimal-pad" />

        <Text style={[styles.label, { color: colors.foreground }]}>Goal</Text>
        <View style={styles.row}>
          {GOALS.map((g) => (
            <Chip key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(g.key)} />
          ))}
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Activity Level</Text>
        <View style={styles.rowWrap}>
          {ACTIVITY_LEVELS.map((a) => (
            <Chip
              key={a.key}
              label={a.label}
              selected={activityLevel === a.key}
              onPress={() => setActivityLevel(a.key)}
            />
          ))}
        </View>

        {error && <Text style={{ color: colors.destructive, marginBottom: spacing.sm }}>{error}</Text>}

        <View style={{ marginTop: spacing.lg }}>
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
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.label, { color: colors.foreground }]}>{props.label}</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
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
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.muted,
          color: selected ? colors.primaryForeground : colors.foreground,
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { fontSize: 15, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
});

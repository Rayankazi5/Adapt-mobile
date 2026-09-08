import { useFocusEffect } from '@react-navigation/native';
import { Activity, Ruler, Scale, Target, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardTitleRow } from '../components/Card';
import { getGoalTargets } from '../engines/trackingEngine';
import { cn } from '../lib/cn';
import { profileService } from '../services/profileService';
import { useTheme } from '../theme/useTheme';
import { ActivityLevel, GoalTargets, Goal, UserProfile } from '../types';

const GOALS: { key: Goal; label: string; description: string }[] = [
  { key: 'cut', label: 'Cut', description: 'Lose fat while preserving muscle (calorie deficit)' },
  { key: 'bulk', label: 'Bulk', description: 'Build muscle with calorie surplus' },
  { key: 'maintain', label: 'Maintain', description: 'Maintain current weight and composition' },
];

const ACTIVITY_LEVELS: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'light', label: 'Light' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'active', label: 'Active' },
  { key: 'very_active', label: 'Very Active' },
];

export function ProfileScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const profile = await profileService.getProfile();
    if (!profile) return;
    setName(profile.name);
    setAge(`${profile.age}`);
    setWeight(`${profile.weightKg}`);
    setHeight(`${profile.heightCm}`);
    setGoal(profile.goal);
    setActivityLevel(profile.activityLevel);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const canSubmit = name.trim().length > 0 && Number(age) > 0 && Number(weight) > 0 && Number(height) > 0;

  let targets: GoalTargets | null = null;
  if (canSubmit) {
    targets = getGoalTargets({
      name: name.trim(),
      age: Number(age),
      weightKg: Number(weight),
      heightCm: Number(height),
      goal,
      activityLevel,
    });
  }

  const handleSave = async () => {
    if (!canSubmit) return;
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView className="bg-background" contentContainerClassName="grow gap-4 px-4 pb-8 pt-16">
      <View>
        <Text className="text-3xl font-bold text-foreground">Your Profile</Text>
        <Text className="text-muted-foreground">Set up your stats to get personalized nutrition targets</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitleRow>
            <User size={20} color={colors.foreground} />
            <CardTitle>Personal Information</CardTitle>
          </CardTitleRow>
          <CardDescription>Your body stats and fitness goal</CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field icon={<User size={12} color={colors.mutedForeground} />} label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <Field icon={<Scale size={12} color={colors.mutedForeground} />} label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" />
            </View>
          </View>
          <Field icon={<Ruler size={12} color={colors.mutedForeground} />} label="Height (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="decimal-pad" />

          <View>
            <Label icon={<Target size={12} color={colors.mutedForeground} />} text="Goal" />
            <View className="flex-row flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(g.key)} />
              ))}
            </View>
            <Text className="mt-1 text-xs text-muted-foreground">{GOALS.find((g) => g.key === goal)?.description}</Text>
          </View>

          <View>
            <Label icon={<Activity size={12} color={colors.mutedForeground} />} text="Activity Level" />
            <View className="flex-row flex-wrap gap-2">
              {ACTIVITY_LEVELS.map((a) => (
                <Chip key={a.key} label={a.label} selected={activityLevel === a.key} onPress={() => setActivityLevel(a.key)} />
              ))}
            </View>
          </View>

          <Button onPress={handleSave} disabled={!canSubmit} loading={saving} className="mt-1">
            {saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {targets && (
        <Card>
          <CardHeader>
            <CardTitleRow>
              <Target size={20} color={colors.foreground} />
              <CardTitle>Your Personalized Targets</CardTitle>
            </CardTitleRow>
            <CardDescription>Calculated using the Mifflin-St Jeor equation</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row flex-wrap gap-3">
              <TargetTile className="bg-muted" label="TDEE" value={`${targets.tdee} kcal`} valueClassName="text-foreground" />
              <TargetTile
                className="bg-muted"
                label="Daily Target"
                value={`${targets.calorieTarget} kcal`}
                valueClassName="text-primary"
                caption={goal === 'cut' ? '−500 deficit' : goal === 'bulk' ? '+400 surplus' : 'Maintenance'}
              />
              <TargetTile className="bg-blue-500/10" label="Protein" value={`${targets.proteinTarget}g`} valueClassName="text-blue-500" labelClassName="text-blue-400" />
              <TargetTile className="bg-green-500/10" label="Carbs" value={`${targets.carbsTarget}g`} valueClassName="text-green-500" labelClassName="text-green-400" />
              <TargetTile className="bg-yellow-500/10" label="Fat" value={`${targets.fatTarget}g`} valueClassName="text-yellow-600" labelClassName="text-yellow-500" />
              <TargetTile className="bg-purple-500/10" label="Goal" value={targets.goal} valueClassName="text-purple-500 capitalize" labelClassName="text-purple-400" />
            </View>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}

function Label({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="mb-1 flex-row items-center gap-1">
      {icon}
      <Text className="text-sm font-medium text-foreground">{text}</Text>
    </View>
  );
}

function Field(props: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}) {
  const { colors } = useTheme();
  return (
    <View>
      {props.icon ? <Label icon={props.icon} text={props.label} /> : (
        <Text className="mb-1 text-sm font-medium text-foreground">{props.label}</Text>
      )}
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

function TargetTile({
  label,
  value,
  caption,
  className,
  valueClassName,
  labelClassName,
}: {
  label: string;
  value: string;
  caption?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <View className={cn('min-w-[45%] flex-1 rounded-lg p-4', className)}>
      <Text className={cn('text-xs uppercase tracking-wider text-muted-foreground', labelClassName)}>{label}</Text>
      <Text className={cn('text-xl font-bold text-foreground', valueClassName)}>{value}</Text>
      {caption && <Text className="text-xs text-muted-foreground">{caption}</Text>}
    </View>
  );
}

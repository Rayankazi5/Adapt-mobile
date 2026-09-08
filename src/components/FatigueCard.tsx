// Mirrors Adapt/components/calories/FatigueCard.tsx.
import { AlertTriangle, Battery, CheckCircle, Heart } from 'lucide-react-native';
import React, { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { FatigueResult } from '../engines/fatigueEngine';
import { cn } from '../lib/cn';
import { Card, CardContent, CardHeader, CardTitleRow } from './Card';
import { RingGauge } from './RingGauge';

type IconType = ComponentType<{ size?: number; color?: string }>;

const LEVELS: { max: number; color: string; track: string; textClass: string; Icon: IconType; label: string }[] = [
  { max: 20, color: '#22c55e', track: '#22c55e33', textClass: 'text-green-500', Icon: CheckCircle, label: 'Well Recovered' },
  { max: 40, color: '#84cc16', track: '#84cc1633', textClass: 'text-lime-500', Icon: Heart, label: 'Mild Fatigue' },
  { max: 60, color: '#eab308', track: '#eab30833', textClass: 'text-yellow-500', Icon: Battery, label: 'Moderate Fatigue' },
  { max: 80, color: '#f97316', track: '#f9731633', textClass: 'text-orange-500', Icon: AlertTriangle, label: 'High Fatigue' },
  { max: 101, color: '#ef4444', track: '#ef444433', textClass: 'text-red-500', Icon: AlertTriangle, label: 'Critical Fatigue' },
];

export function FatigueCard({ fatigue }: { fatigue: FatigueResult }) {
  const score = fatigue.fatigue_score;
  const level = LEVELS.find((l) => score <= l.max) ?? LEVELS[LEVELS.length - 1];
  const Icon = level.Icon;

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitleRow>
          <Icon size={20} color={level.color} />
          <Text className="text-base font-medium text-foreground">Fatigue & Recovery</Text>
        </CardTitleRow>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="flex-row items-center gap-5">
          <View className="h-24 w-24 shrink-0 items-center justify-center">
            <View className="absolute h-24 w-24 items-center justify-center">
              <RingGauge score={score} color={level.color} trackColor={level.track} />
            </View>
            <View className="items-center">
              <Text className={cn(level.textClass, 'text-2xl font-bold leading-none')}>{score}</Text>
              <Text className="text-[10px] text-muted-foreground">/100</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className={cn(level.textClass, 'text-lg font-semibold')}>{level.label}</Text>
            <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {fatigue.recovery_recommendation}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Factor label="Calories" value={fatigue.breakdown.calorie_factor} max={35} />
          <Factor label="Protein" value={fatigue.breakdown.protein_factor} max={25} />
          <Factor label="Hydration" value={fatigue.breakdown.hydration_factor} max={20} />
          <Factor label="Workout" value={fatigue.breakdown.workout_factor} max={20} />
        </View>
      </CardContent>
    </Card>
  );
}

function Factor({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View className="flex-1 items-center rounded-lg bg-muted p-2">
      <Text className="mb-0.5 text-center text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Text>
      <Text className="text-sm font-bold text-foreground">
        {value}
        <Text className="font-normal text-muted-foreground">/{max}</Text>
      </Text>
    </View>
  );
}


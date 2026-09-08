// Mirrors Adapt/components/calories/VitaminTracker.tsx.
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';
import { FoodEntry, MealLog } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card';

type VitaminKey =
  | 'vitamin_a' | 'vitamin_b1' | 'vitamin_b2' | 'vitamin_b3' | 'vitamin_b6' | 'vitamin_b9'
  | 'vitamin_b12' | 'vitamin_c' | 'vitamin_d' | 'vitamin_e' | 'vitamin_k';

// Recommended Daily Values (RDV) for adults
const VITAMIN_TARGETS: Record<VitaminKey, { label: string; rdv: number; unit: string }> = {
  vitamin_a: { label: 'Vitamin A', rdv: 900, unit: 'mcg' },
  vitamin_b1: { label: 'Vitamin B1 (Thiamin)', rdv: 1.2, unit: 'mg' },
  vitamin_b2: { label: 'Vitamin B2 (Riboflavin)', rdv: 1.3, unit: 'mg' },
  vitamin_b3: { label: 'Vitamin B3 (Niacin)', rdv: 16, unit: 'mg' },
  vitamin_b6: { label: 'Vitamin B6', rdv: 1.7, unit: 'mg' },
  vitamin_b9: { label: 'Vitamin B9 (Folate)', rdv: 400, unit: 'mcg' },
  vitamin_b12: { label: 'Vitamin B12', rdv: 2.4, unit: 'mcg' },
  vitamin_c: { label: 'Vitamin C', rdv: 90, unit: 'mg' },
  vitamin_d: { label: 'Vitamin D', rdv: 20, unit: 'mcg' },
  vitamin_e: { label: 'Vitamin E', rdv: 15, unit: 'mg' },
  vitamin_k: { label: 'Vitamin K', rdv: 120, unit: 'mcg' },
};

const KEYS = Object.keys(VITAMIN_TARGETS) as VitaminKey[];

function getProgressColor(percentage: number) {
  if (percentage < 30) return 'bg-red-500';
  if (percentage < 70) return 'bg-yellow-500';
  if (percentage <= 150) return 'bg-green-500';
  return 'bg-blue-500'; // excess / surplus
}

export function VitaminTracker({ foodLogs }: { foodLogs: MealLog[] }) {
  const consumed = KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Record<VitaminKey, number>);
  for (const log of foodLogs) {
    for (const entry of log.entries) {
      for (const k of KEYS) consumed[k] += (entry as FoodEntry)[k] || 0;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Micronutrients & Vitamins</CardTitle>
        <CardDescription>Track your essential daily vitamins from logged foods</CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        {KEYS.map((key) => {
          const { label, rdv, unit } = VITAMIN_TARGETS[key];
          const amount = consumed[key];
          const rawPct = (amount / rdv) * 100;
          const percentage = Math.min(rawPct, 100);
          return (
            <View key={key} className="gap-2">
              <View className="flex-row items-end justify-between">
                <Text className="text-sm font-medium text-foreground">{label}</Text>
                <Text className="text-xs text-muted-foreground">
                  {amount.toFixed(1)}{unit} / {rdv}{unit}
                </Text>
              </View>
              <View className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <View className={cn('h-full', getProgressColor(rawPct))} style={{ width: `${percentage}%` }} />
              </View>
              <Text className="text-right text-[10px] text-muted-foreground">{rawPct.toFixed(0)}% RDV</Text>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
}

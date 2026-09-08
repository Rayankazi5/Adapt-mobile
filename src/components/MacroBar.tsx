// Mirrors the colored-dot macro bars in the "Today's Macros" card on
// Adapt/pages/Dashboard.tsx.
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

const DOT: Record<'blue' | 'green' | 'yellow', string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
};

const TRACK: Record<'blue' | 'green' | 'yellow', string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/30',
  green: 'bg-green-100 dark:bg-green-900/30',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
};

export function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: 'blue' | 'green' | 'yellow';
}) {
  const pct = target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0;
  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className={cn('h-2.5 w-2.5 rounded-full', DOT[color])} />
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        </View>
        <Text className="text-sm text-muted-foreground">
          {value}g <Text className="text-muted-foreground/60">/ {target}g</Text>
        </Text>
      </View>
      <View className={cn('h-2 overflow-hidden rounded-full', TRACK[color])}>
        <View className={cn('h-full rounded-full', DOT[color])} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

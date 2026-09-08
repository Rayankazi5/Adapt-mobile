// Simplified port of the gradient stat cards on Adapt/pages/Dashboard.tsx —
// solid tinted background instead of a CSS gradient (NativeWind's gradient
// utilities need expo-linear-gradient wiring not worth it for this).
import React, { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';
import { Card, CardContent, CardHeader } from './Card';

type IconType = ComponentType<{ size?: number; color?: string }>;

interface Props {
  label: string;
  value: string;
  suffix?: string;
  caption: string;
  captionClassName?: string;
  Icon: IconType;
  tint: 'orange' | 'green' | 'blue' | 'purple';
  progressPct: number;
}

const TINTS: Record<Props['tint'], { bg: string; iconBg: string; iconColor: string; bar: string }> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/40', iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: '#f97316', bar: 'bg-orange-500' },
  green: { bg: 'bg-green-50 dark:bg-green-950/40', iconBg: 'bg-green-100 dark:bg-green-900/40', iconColor: '#22c55e', bar: 'bg-green-500' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: '#3b82f6', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: '#a855f7', bar: 'bg-purple-500' },
};

export function StatCard({ label, value, suffix, caption, captionClassName, Icon, tint, progressPct }: Props) {
  const t = TINTS[tint];
  return (
    <Card className={cn('flex-1', t.bg)}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <View className={cn('rounded-lg p-1.5', t.iconBg)}>
          <Icon size={16} color={t.iconColor} />
        </View>
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-bold text-foreground">
          {value}
          {suffix && <Text className="text-base font-normal text-muted-foreground"> {suffix}</Text>}
        </Text>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <View className={cn('h-full rounded-full', t.bar)} style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
        </View>
        <Text className={cn('mt-2 text-xs text-muted-foreground', captionClassName)}>{caption}</Text>
      </CardContent>
    </Card>
  );
}

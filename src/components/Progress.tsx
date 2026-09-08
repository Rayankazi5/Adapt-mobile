// Mirrors Adapt/components/ui/progress.tsx (shadcn Progress).
import React from 'react';
import { View } from 'react-native';
import { cn } from '../lib/cn';

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
}) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <View className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <View className={cn('h-full rounded-full bg-primary', barClassName)} style={{ width: `${pct}%` }} />
    </View>
  );
}

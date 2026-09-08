// Mirrors Adapt/components/ui/alert.tsx (shadcn Alert).
import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

export function Alert({
  variant = 'default',
  icon,
  title,
  children,
}: {
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const destructive = variant === 'destructive';
  return (
    <View className={cn('flex-row gap-3 rounded-lg border p-4', destructive ? 'border-destructive/50 bg-card' : 'border-border bg-card')}>
      {icon ? <View className="mt-0.5">{icon}</View> : null}
      <View className="flex-1 gap-1">
        <Text className={cn('text-sm font-medium', destructive ? 'text-destructive' : 'text-foreground')}>{title}</Text>
        <Text className={cn('text-sm', destructive ? 'text-destructive' : 'text-muted-foreground')}>{children}</Text>
      </View>
    </View>
  );
}

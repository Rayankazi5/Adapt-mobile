// Mirrors Adapt/components/ui/card.tsx (shadcn Card) structurally, so
// screens compose Card/CardHeader/CardTitle/CardContent the same way.
import React, { PropsWithChildren } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { cn } from '../lib/cn';

type Props = PropsWithChildren<{ className?: string; style?: ViewStyle }>;

export function Card({ children, className, style }: Props) {
  return (
    <View className={cn('gap-4 rounded-xl border border-border bg-card', className)} style={style}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: Props) {
  return <View className={cn('gap-1.5 px-4 pt-4', className)}>{children}</View>;
}

export function CardTitle({ children, className }: Props) {
  return <Text className={cn('text-base font-medium leading-none text-foreground', className)}>{children}</Text>;
}

// Icon + CardTitle, side by side — Text can't lay out flex children itself.
export function CardTitleRow({ children, className }: Props) {
  return <View className={cn('flex-row items-center gap-2', className)}>{children}</View>;
}

export function CardDescription({ children, className }: Props) {
  return <Text className={cn('text-sm text-muted-foreground', className)}>{children}</Text>;
}

export function CardContent({ children, className }: Props) {
  return <View className={cn('px-4 pb-4', className)}>{children}</View>;
}

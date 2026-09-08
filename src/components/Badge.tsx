// Mirrors Adapt/components/ui/badge.tsx (shadcn Badge).
import React, { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

type Variant = 'default' | 'secondary' | 'outline' | 'destructive';

const BOX: Record<Variant, string> = {
  default: 'border-transparent bg-primary',
  secondary: 'border-transparent bg-secondary',
  outline: 'border-border bg-transparent',
  destructive: 'border-transparent bg-destructive',
};

const TEXT: Record<Variant, string> = {
  default: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  destructive: 'text-white',
};

export function Badge({
  children,
  variant = 'default',
  className,
  textClassName,
}: PropsWithChildren<{ variant?: Variant; className?: string; textClassName?: string }>) {
  return (
    <View className={cn('self-start rounded-md border px-2 py-0.5', BOX[variant], className)}>
      <Text className={cn('text-xs font-medium', TEXT[variant], textClassName)}>{children}</Text>
    </View>
  );
}

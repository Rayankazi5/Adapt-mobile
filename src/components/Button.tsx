// Mirrors Adapt/components/ui/button.tsx (shadcn Button) variant/size scale.
import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { cn } from '../lib/cn';
import { useTheme } from '../theme/useTheme';

type Variant = 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost';
type Size = 'default' | 'sm' | 'lg';

interface Props {
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

const VARIANT_BG: Record<Variant, string> = {
  primary: 'bg-primary',
  destructive: 'bg-destructive',
  outline: 'border border-border bg-background',
  secondary: 'bg-secondary',
  ghost: 'bg-transparent',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  destructive: 'text-white',
  outline: 'text-foreground',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
};

const SIZE_CLASS: Record<Size, string> = {
  default: 'h-9 px-4',
  sm: 'h-8 px-3',
  lg: 'h-10 px-6',
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled,
  loading,
  className,
  textClassName,
  icon,
}: PropsWithChildren<Props>) {
  const { colors } = useTheme();
  const indicatorColor = variant === 'primary' ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-md active:opacity-85',
        VARIANT_BG[variant],
        SIZE_CLASS[size],
        disabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={cn('text-sm font-medium', VARIANT_TEXT[variant], textClassName)}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}

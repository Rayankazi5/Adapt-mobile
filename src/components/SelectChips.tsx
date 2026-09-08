// RN stand-in for the web app's <Select>: a wrapping row of selectable chips.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '../lib/cn';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: ChipOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SelectChips<T extends string>({ value, options, onChange, size = 'md', className }: Props<T>) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              'rounded-lg border',
              size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5',
              active ? 'border-primary bg-primary' : 'border-border bg-muted/30'
            )}
          >
            <Text
              className={cn(
                size === 'sm' ? 'text-xs' : 'text-sm',
                'font-medium',
                active ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

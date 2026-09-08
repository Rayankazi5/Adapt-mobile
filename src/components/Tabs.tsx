// Mirrors the look of Adapt/components/ui/tabs.tsx (shadcn Tabs) as a
// controlled pill switcher; the parent renders the active content.
import React, { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '../lib/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: TabOption<T>[];
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: Props<T>) {
  return (
    <View className={cn('h-9 flex-row items-center rounded-xl bg-muted p-[3px]', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            className={cn(
              'h-full flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-transparent px-2',
              active && 'border-border bg-card'
            )}
          >
            {tab.icon}
            <Text className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Mirrors Adapt/components/calories/FoodLogCard.tsx.
import { Plus, Trash2 } from 'lucide-react-native';
import React, { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FoodEntry } from '../types';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitleRow } from './Card';

type IconType = ComponentType<{ size?: number; color?: string }>;

interface Props {
  label: string;
  Icon: IconType;
  entries: FoodEntry[];
  onAddFood: () => void;
  onDeleteFood: (id: string) => void;
}

export function FoodLogCard({ label, Icon, entries, onAddFood, onDeleteFood }: Props) {
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fats: acc.fats + e.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-1">
        <CardTitleRow>
          <Icon size={18} />
          <Text className="text-lg font-medium text-foreground">{label}</Text>
        </CardTitleRow>
        <Button size="sm" onPress={onAddFood} icon={<Plus size={16} color="white" />}>
          Add Food
        </Button>
      </CardHeader>
      <CardContent className="gap-3">
        {entries.length === 0 ? (
          <Text className="py-4 text-center text-sm text-muted-foreground">
            No items logged yet. Tap "Add Food" to get started.
          </Text>
        ) : (
          <>
            {entries.map((entry) => (
              <View key={entry.id} className="flex-row items-start justify-between rounded-lg bg-accent p-3">
                <View className="flex-1">
                  <View className="mb-1 flex-row items-center gap-2">
                    <Text className="font-medium text-foreground">{entry.name}</Text>
                    <Text className="text-xs text-muted-foreground">{entry.time}</Text>
                  </View>
                  <View className="flex-row gap-3">
                    <Text className="text-sm text-muted-foreground">{entry.calories} kcal</Text>
                    <Text className="text-sm text-muted-foreground">P: {entry.protein}g</Text>
                    <Text className="text-sm text-muted-foreground">C: {entry.carbs}g</Text>
                    <Text className="text-sm text-muted-foreground">F: {entry.fats}g</Text>
                  </View>
                </View>
                <Pressable onPress={() => onDeleteFood(entry.id)} className="p-1">
                  <Trash2 size={16} color="#d4183d" />
                </Pressable>
              </View>
            ))}

            <View className="flex-row items-center justify-between border-t border-border pt-3">
              <Text className="font-medium text-foreground">Total</Text>
              <View className="flex-row gap-3">
                <Text className="text-sm font-medium text-foreground">{totals.calories} kcal</Text>
                <Text className="text-sm text-muted-foreground">P: {totals.protein}g</Text>
                <Text className="text-sm text-muted-foreground">C: {totals.carbs}g</Text>
                <Text className="text-sm text-muted-foreground">F: {totals.fats}g</Text>
              </View>
            </View>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Mirrors Adapt/components/calories/FoodLogCard.tsx.
import { Plus, Trash2 } from 'lucide-react-native';
import React, { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
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

const VITAMINS: { key: keyof FoodEntry; label: string; unit: string }[] = [
  { key: 'vitamin_a', label: 'Vit A', unit: 'mcg' },
  { key: 'vitamin_b1', label: 'Vit B1', unit: 'mg' },
  { key: 'vitamin_b2', label: 'Vit B2', unit: 'mg' },
  { key: 'vitamin_b3', label: 'Vit B3', unit: 'mg' },
  { key: 'vitamin_b6', label: 'Vit B6', unit: 'mg' },
  { key: 'vitamin_b9', label: 'Vit B9', unit: 'mcg' },
  { key: 'vitamin_b12', label: 'Vit B12', unit: 'mcg' },
  { key: 'vitamin_c', label: 'Vit C', unit: 'mg' },
  { key: 'vitamin_d', label: 'Vit D', unit: 'mcg' },
  { key: 'vitamin_e', label: 'Vit E', unit: 'mg' },
  { key: 'vitamin_k', label: 'Vit K', unit: 'mcg' },
];

export function FoodLogCard({ label, Icon, entries, onAddFood, onDeleteFood }: Props) {
  const { colors } = useTheme();
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
          <Icon size={18} color={colors.foreground} />
          <Text className="text-lg font-medium text-foreground">{label}</Text>
        </CardTitleRow>
        <Button size="sm" onPress={onAddFood} icon={<Plus size={16} color={colors.primaryForeground} />}>
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
            {entries.map((entry) => {
              const vitamins = VITAMINS.filter((v) => Number(entry[v.key]) > 0);
              return (
                <View key={entry.id} className="flex-row items-start justify-between rounded-lg bg-accent p-3">
                  <View className="flex-1">
                    <View className="mb-1 flex-row items-center gap-2">
                      <Text className="font-medium text-foreground">{entry.name}</Text>
                      <Text className="text-xs text-muted-foreground">{entry.time}</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-x-3">
                      <Text className="text-sm text-muted-foreground">{entry.calories} kcal</Text>
                      <Text className="text-sm text-muted-foreground">P: {entry.protein}g</Text>
                      <Text className="text-sm text-muted-foreground">C: {entry.carbs}g</Text>
                      <Text className="text-sm text-muted-foreground">F: {entry.fats}g</Text>
                    </View>
                    {vitamins.length > 0 && (
                      <View className="mt-1.5 flex-row flex-wrap gap-x-3 gap-y-1">
                        {vitamins.map((v) => (
                          <Text key={v.key} className="text-[11px] text-muted-foreground">
                            {v.label}: {Number(entry[v.key]).toFixed(1)}{v.unit}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Pressable onPress={() => onDeleteFood(entry.id)} className="p-1">
                    <Trash2 size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              );
            })}

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

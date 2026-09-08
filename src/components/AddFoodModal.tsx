// Mirrors the "Manual" tab of Adapt/components/calories/AddFoodDialog.tsx
// (AI Track / Barcode tabs are out of scope for the mobile MVP).
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FoodNutritionInfo, searchFoods } from '../data/foodNutritionData';
import { scaleNutrition } from '../engines/trackingEngine';
import { useTheme } from '../theme/useTheme';
import { FoodEntry, MealType } from '../types';
import { Button } from './Button';

interface Props {
  visible: boolean;
  mealType: MealType | null;
  mealLabel: string;
  onClose: () => void;
  onAdd: (entry: FoodEntry) => void;
}

export function AddFoodModal({ visible, mealLabel, onClose, onAdd }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodNutritionInfo | null>(null);
  const [amount, setAmount] = useState('');

  const results = useMemo(() => (query.trim().length > 1 ? searchFoods(query.trim()).slice(0, 6) : []), [query]);

  const preview = useMemo(() => {
    if (!selected) return null;
    const amt = Number(amount);
    if (!amt || amt <= 0) return null;
    return scaleNutrition(selected, amt);
  }, [selected, amount]);

  const reset = () => {
    setQuery('');
    setSelected(null);
    setAmount('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!selected || !amount) return;
    const amt = Number(amount);
    const scaled = scaleNutrition(selected, amt);
    onAdd({
      id: `${Date.now()}`,
      name: selected.displayName,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fats: scaled.fat,
      quantityG: amt,
      time: new Date().toTimeString().slice(0, 5),
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-2xl bg-card px-5 pb-8 pt-5">
          <Text className="text-lg font-semibold text-foreground">Add Food to {mealLabel}</Text>
          <Text className="mb-4 text-sm text-muted-foreground">Search the food database</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-1 text-sm font-medium text-foreground">Food Name</Text>
            <TextInput
              className="rounded-[10px] border border-border bg-background px-4 py-2.5 text-base text-foreground"
              placeholder="e.g. Dosa or Grilled Chicken"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setSelected(null);
              }}
            />

            {results.length > 0 && !selected && (
              <View className="mt-1 overflow-hidden rounded-[10px] border border-border">
                {results.map((item, i) => (
                  <Pressable
                    key={item.id}
                    className={`px-4 py-2.5 ${i < results.length - 1 ? 'border-b border-border' : ''}`}
                    onPress={() => {
                      setSelected(item);
                      setQuery(item.displayName);
                    }}
                  >
                    <Text className="font-medium text-foreground">{item.displayName}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {item.calories} kcal / {item.servingSize}{item.servingUnit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {selected && (
              <View className="mt-4">
                <Text className="mb-1 text-sm font-medium text-foreground">Amount (grams)</Text>
                <TextInput
                  className="rounded-[10px] border border-border bg-background px-4 py-2.5 text-base text-foreground"
                  placeholder={`e.g. ${selected.servingSize}`}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />

                <View className="mt-4 flex-row justify-between border-t border-border pt-3">
                  <PreviewStat label="Calories" value={`${preview?.calories ?? 0} kcal`} />
                  <PreviewStat label="Protein" value={`${preview?.protein ?? 0}g`} />
                  <PreviewStat label="Carbs" value={`${preview?.carbs ?? 0}g`} />
                  <PreviewStat label="Fats" value={`${preview?.fat ?? 0}g`} />
                </View>
              </View>
            )}
          </ScrollView>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Button variant="outline" onPress={handleClose}>
                Cancel
              </Button>
            </View>
            <View className="flex-1">
              <Button onPress={handleSubmit} disabled={!selected || !amount}>
                Add Food
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="mb-1 text-xs text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

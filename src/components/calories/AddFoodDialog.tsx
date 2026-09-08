// Mirrors Adapt/components/calories/AddFoodDialog.tsx (Manual / AI Track /
// Barcode), as a bottom-sheet Modal.
import { PenLine, Scan, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { getAllFoodNames, getNutritionByLabel } from '../../data/foodNutritionData';
import { cn } from '../../lib/cn';
import { useTheme } from '../../theme/useTheme';
import { FoodEntry, MealType } from '../../types';
import { Button } from '../Button';
import { SelectChips } from '../SelectChips';
import { Tabs } from '../Tabs';
import { toast } from '../Toast';
import { AIFoodScanner } from './AIFoodScanner';
import { BarcodeScanner } from './BarcodeScanner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodAdded: (food: Omit<FoodEntry, 'id'>) => void;
  mealType: MealType | null;
}

type Tab = 'manual' | 'ai' | 'barcode';
type Unit = 'grams' | 'servings';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  supplement: 'Supplement',
};

const EMPTY = { name: '', amount: '', unit: 'grams' as Unit, calories: '', protein: '', carbs: '', fats: '' };

export function AddFoodDialog({ open, onOpenChange, onFoodAdded, mealType }: Props) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('manual');
  const [manualEntry, setManualEntry] = useState(EMPTY);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-calculate macros when food name, amount, or unit change
  useEffect(() => {
    const nutrition = getNutritionByLabel(manualEntry.name);
    const amountVal = Number(manualEntry.amount);
    if (nutrition && amountVal > 0) {
      const g = manualEntry.unit === 'servings' ? amountVal * nutrition.servingSize : amountVal;
      const scale = g / nutrition.servingSize;
      setManualEntry((prev) => ({
        ...prev,
        calories: String(Math.round(nutrition.calories * scale)),
        protein: String(Math.round(nutrition.protein * scale)),
        carbs: String(Math.round(nutrition.carbs * scale)),
        fats: String(Math.round(nutrition.fats * scale)),
      }));
    } else {
      setManualEntry((prev) => (prev.calories === '' ? prev : { ...prev, calories: '' }));
    }
  }, [manualEntry.name, manualEntry.amount, manualEntry.unit]);

  const handleManualSubmit = () => {
    if (!manualEntry.name || !manualEntry.amount) {
      toast.error('Please fill in food name and amount');
      return;
    }

    const amountEntered = Number(manualEntry.amount);
    const nutrition = getNutritionByLabel(manualEntry.name);
    const time = new Date().toTimeString().slice(0, 5);
    let calories: number;

    if (nutrition) {
      const g = manualEntry.unit === 'servings' ? amountEntered * nutrition.servingSize : amountEntered;
      const scale = g / nutrition.servingSize;
      calories = Math.round(nutrition.calories * scale);
      const v = (x?: number) => (x ? x * scale : 0);
      onFoodAdded({
        name: manualEntry.name,
        calories,
        protein: Math.round(nutrition.protein * scale),
        carbs: Math.round(nutrition.carbs * scale),
        fats: Math.round(nutrition.fats * scale),
        time,
        vitamin_a: v(nutrition.vitamin_a), vitamin_b1: v(nutrition.vitamin_b1), vitamin_b2: v(nutrition.vitamin_b2),
        vitamin_b3: v(nutrition.vitamin_b3), vitamin_b6: v(nutrition.vitamin_b6), vitamin_b9: v(nutrition.vitamin_b9),
        vitamin_b12: v(nutrition.vitamin_b12), vitamin_c: v(nutrition.vitamin_c), vitamin_d: v(nutrition.vitamin_d),
        vitamin_e: v(nutrition.vitamin_e), vitamin_k: v(nutrition.vitamin_k),
      });
    } else {
      // Fallback: manually entered macros, calories estimated from them
      const protein = Number(manualEntry.protein) || 0;
      const carbs = Number(manualEntry.carbs) || 0;
      const fats = Number(manualEntry.fats) || 0;
      calories = protein * 4 + carbs * 4 + fats * 9;
      onFoodAdded({ name: manualEntry.name, calories, protein, carbs, fats, time });
    }

    setManualEntry(EMPTY);
    toast.success(`Food added: ${amountEntered} ${manualEntry.unit}${nutrition ? ` (${calories} kcal)` : ''}!`);
  };

  const close = () => onOpenChange(false);
  const suggestions = isSearching && manualEntry.name.length > 0
    ? getAllFoodNames().filter((n) => n.toLowerCase().includes(manualEntry.name.toLowerCase())).slice(0, 5)
    : [];
  const previewCalories =
    manualEntry.calories ||
    (Number(manualEntry.protein) * 4 + Number(manualEntry.carbs) * 4 + Number(manualEntry.fats) * 9 || 0);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView className="flex-1 justify-end bg-black/40" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="flex-1" onPress={close} />
        <View className="max-h-[90%] rounded-t-2xl bg-card px-5 pb-8 pt-5">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">Add Food to {mealType ? MEAL_LABELS[mealType] : 'Meal'}</Text>
              <Text className="text-sm text-muted-foreground">Choose how you'd like to log your food</Text>
            </View>
            <Pressable onPress={close} className="p-1">
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'manual', label: 'Manual', icon: <PenLine size={14} color={tab === 'manual' ? colors.foreground : colors.mutedForeground} /> },
              { value: 'ai', label: 'AI Track', icon: <Sparkles size={14} color={tab === 'ai' ? colors.foreground : colors.mutedForeground} /> },
              { value: 'barcode', label: 'Barcode', icon: <Scan size={14} color={tab === 'barcode' ? colors.foreground : colors.mutedForeground} /> },
            ]}
          />

          <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
            {tab === 'manual' && (
              <View className="gap-4">
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">Food Name *</Text>
                  <TextInput
                    className="h-10 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
                    placeholder="e.g., Dahi Vada or Grilled Chicken"
                    placeholderTextColor={colors.mutedForeground}
                    value={manualEntry.name}
                    onChangeText={(name) => setManualEntry({ ...manualEntry, name })}
                    onFocus={() => setIsSearching(true)}
                    onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                  />
                  {suggestions.length > 0 && (
                    <View className="overflow-hidden rounded-lg border border-border bg-popover">
                      {suggestions.map((name, i) => (
                        <Pressable
                          key={name}
                          onPress={() => { setManualEntry({ ...manualEntry, name }); setIsSearching(false); }}
                          className={cn('px-3 py-2', i < suggestions.length - 1 && 'border-b border-border')}
                        >
                          <Text className="text-sm text-foreground">{name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">Amount *</Text>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      className="h-10 flex-1 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
                      placeholder="e.g. 200"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                      value={manualEntry.amount}
                      onChangeText={(amount) => setManualEntry({ ...manualEntry, amount })}
                    />
                    <SelectChips
                      size="sm"
                      value={manualEntry.unit}
                      options={[{ value: 'grams', label: 'Grams' }, { value: 'servings', label: 'Servings' }]}
                      onChange={(unit) => setManualEntry({ ...manualEntry, unit })}
                    />
                  </View>
                </View>

                <View className="flex-row justify-between border-t border-border pt-3">
                  <Preview label="Calories" value={`${previewCalories} kcal`} />
                  <Preview label="Protein" value={`${manualEntry.protein || '0'}g`} />
                  <Preview label="Carbs" value={`${manualEntry.carbs || '0'}g`} />
                  <Preview label="Fats" value={`${manualEntry.fats || '0'}g`} />
                </View>

                <Button onPress={handleManualSubmit}>Add Food</Button>
              </View>
            )}

            {tab === 'ai' && (
              <AIFoodScanner
                onFoodRecognized={(food) => {
                  onFoodAdded(food);
                  toast.success('AI analysis complete! Food added.');
                }}
              />
            )}

            {tab === 'barcode' && <BarcodeScanner onFoodRecognized={onFoodAdded} />}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="mb-1 text-xs text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

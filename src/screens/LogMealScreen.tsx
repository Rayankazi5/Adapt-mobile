import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FoodNutritionInfo, searchFoods } from '../data/foodNutritionData';
import { scaleNutrition } from '../engines/trackingEngine';
import { dataService } from '../services/dataService';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/useTheme';
import { FoodEntry, MealLog, MealType } from '../types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'dessert', 'supplement'];

export function LogMealScreen() {
  const { colors } = useTheme();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodNutritionInfo | null>(null);
  const [quantity, setQuantity] = useState('');

  const load = useCallback(async () => {
    setLogs(await dataService.getFoodLogs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const results = useMemo(() => (query.trim().length > 1 ? searchFoods(query.trim()).slice(0, 20) : []), [query]);

  const currentLog = logs.find((l) => l.type === mealType);

  const handleAdd = async () => {
    if (!selectedFood) return;
    const qty = Number(quantity) || selectedFood.servingSize;
    const scaled = scaleNutrition(selectedFood, qty);
    const entry: FoodEntry = {
      id: `${Date.now()}`,
      name: selectedFood.displayName,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fats: scaled.fat,
      quantityG: qty,
      time: new Date().toISOString(),
    };
    const next = await dataService.addFoodEntry(mealType, entry);
    setLogs(next);
    setSelectedFood(null);
    setQuery('');
    setQuantity('');
  };

  const handleRemove = async (entryId: string) => {
    const next = await dataService.removeFoodEntry(mealType, entryId);
    setLogs(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabRow}>
        {MEAL_TYPES.map((type) => (
          <Pressable key={type} onPress={() => setMealType(type)} style={styles.tabPress}>
            <Text
              style={[
                styles.tab,
                {
                  color: mealType === type ? colors.primaryForeground : colors.foreground,
                  backgroundColor: mealType === type ? colors.primary : colors.muted,
                },
              ]}
            >
              {type[0].toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.search, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        placeholder="Search foods (e.g. dosa, rice, chicken)"
        placeholderTextColor={colors.mutedForeground}
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          setSelectedFood(null);
        }}
      />

      {results.length > 0 && !selectedFood && (
        <View style={[styles.resultsBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 220 }}
            renderItem={({ item }) => (
              <Pressable style={styles.resultRow} onPress={() => setSelectedFood(item)}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.displayName}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  {item.calories} kcal / {item.servingSize}{item.servingUnit}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {selectedFood && (
        <Card style={{ marginTop: spacing.sm }}>
          <Text style={[styles.selectedName, { color: colors.foreground }]}>{selectedFood.displayName}</Text>
          <Text style={{ color: colors.mutedForeground, marginBottom: spacing.sm }}>
            {selectedFood.calories} kcal per {selectedFood.servingSize}{selectedFood.servingUnit}
          </Text>
          <TextInput
            style={[styles.search, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder={`Quantity in grams (default ${selectedFood.servingSize})`}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
          <View style={{ marginTop: spacing.sm }}>
            <Button onPress={handleAdd}>Add to {mealType}</Button>
          </View>
        </Card>
      )}

      <FlatList
        style={{ marginTop: spacing.md }}
        data={currentLog?.entries ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.lg }}>
            No {mealType} entries yet.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.entryCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {item.quantityG}g · {item.calories} kcal · P{item.protein} C{item.carbs} F{item.fats}
              </Text>
            </View>
            <Pressable onPress={() => handleRemove(item.id)}>
              <Text style={{ color: colors.destructive, fontWeight: '600' }}>Remove</Text>
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  tabPress: {},
  tab: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
  },
  resultsBox: {
    marginTop: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: 'hidden',
  },
  resultRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  selectedName: { fontSize: 16, fontWeight: '700' },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});

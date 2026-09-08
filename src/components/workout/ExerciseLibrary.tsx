// Mirrors Adapt/components/workout/ExerciseLibrary.tsx.
import { BookOpen, Dumbbell, Info, Plus, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../theme/useTheme';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardTitleRow } from '../Card';
import { Dialog } from '../Dialog';
import { SelectChips } from '../SelectChips';
import { toast } from '../Toast';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface ExerciseData {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: Difficulty;
  instructions?: string;
  isCustom?: boolean;
}

const INITIAL_EXERCISES: ExerciseData[] = [
  { id: '1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: '2', name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: '3', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Advanced' },
  { id: '4', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', difficulty: 'Intermediate' },
  { id: '5', name: 'Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: '6', name: 'Bicep Curl', muscleGroup: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: '7', name: 'Tricep Dips', muscleGroup: 'Arms', equipment: 'Bodyweight', difficulty: 'Intermediate' },
  { id: '8', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', difficulty: 'Beginner' },
  { id: '9', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: '10', name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: '11', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', difficulty: 'Intermediate' },
  { id: '12', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', difficulty: 'Beginner' },
  { id: '13', name: 'Hammer Curl', muscleGroup: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: '14', name: 'Leg Curl', muscleGroup: 'Legs', equipment: 'Machine', difficulty: 'Beginner' },
  { id: '15', name: 'Push-ups', muscleGroup: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { id: '16', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { id: '17', name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Intermediate' },
  { id: '18', name: 'Calf Raises', muscleGroup: 'Legs', equipment: 'Machine', difficulty: 'Beginner' },
  { id: '19', name: 'Lunges', muscleGroup: 'Legs', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { id: '20', name: 'Bent Over Row', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Intermediate' },
];

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
const EQUIPMENT_TYPES = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'];
const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

const withAll = (label: string, values: string[]) => [{ value: 'all', label }, ...values.map((v) => ({ value: v, label: v }))];

const DIFFICULTY_BADGE: Record<Difficulty, { box: string; text: string }> = {
  Beginner: { box: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' },
  Intermediate: { box: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-300' },
  Advanced: { box: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-300' },
};

const EMPTY_NEW = { name: '', muscleGroup: '', equipment: '', difficulty: 'Beginner' as Difficulty, instructions: '' };

export function ExerciseLibrary() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscleGroup, setFilterMuscleGroup] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [exercises, setExercises] = useState<ExerciseData[]>(INITIAL_EXERCISES);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExercise, setNewExercise] = useState(EMPTY_NEW);

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = filterMuscleGroup === 'all' || e.muscleGroup === filterMuscleGroup;
    const matchesEquipment = filterEquipment === 'all' || e.equipment === filterEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const handleAddExercise = () => {
    if (!newExercise.name || !newExercise.muscleGroup || !newExercise.equipment) {
      toast.error('Please fill in all required fields');
      return;
    }
    setExercises([...exercises, { id: Date.now().toString(), ...newExercise, isCustom: true }]);
    setNewExercise(EMPTY_NEW);
    setIsAddDialogOpen(false);
    toast.success('Custom exercise added!');
  };

  return (
    <View className="gap-6">
      <Card>
        <CardHeader className="gap-3">
          <View className="gap-1">
            <CardTitleRow>
              <BookOpen size={20} color={colors.foreground} />
              <CardTitle>Exercise Library</CardTitle>
            </CardTitleRow>
            <CardDescription>Browse {exercises.length} exercises or create custom ones</CardDescription>
          </View>
          <Button onPress={() => setIsAddDialogOpen(true)} icon={<Plus size={16} color={colors.primaryForeground} />}>
            Add Custom Exercise
          </Button>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Search</Text>
            <View className="relative justify-center">
              <View className="absolute left-3 z-10">
                <Search size={16} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="h-10 rounded-md border border-border bg-input-background pl-9 pr-3 text-sm text-foreground"
                placeholder="Search exercises..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Muscle Group</Text>
            <SelectChips size="sm" value={filterMuscleGroup} options={withAll('All Groups', MUSCLE_GROUPS)} onChange={setFilterMuscleGroup} />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Equipment</Text>
            <SelectChips size="sm" value={filterEquipment} options={withAll('All Equipment', EQUIPMENT_TYPES)} onChange={setFilterEquipment} />
          </View>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} title="Add Custom Exercise" description="Create a new exercise for your workout library">
        <View className="gap-4">
          <Field label="Exercise Name *">
            <TextInput
              className="h-10 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
              placeholder="e.g., Weighted Pull-ups"
              placeholderTextColor={colors.mutedForeground}
              value={newExercise.name}
              onChangeText={(name) => setNewExercise({ ...newExercise, name })}
            />
          </Field>
          <Field label="Muscle Group *">
            <SelectChips size="sm" value={newExercise.muscleGroup} options={MUSCLE_GROUPS.map((g) => ({ value: g, label: g }))} onChange={(muscleGroup) => setNewExercise({ ...newExercise, muscleGroup })} />
          </Field>
          <Field label="Equipment *">
            <SelectChips size="sm" value={newExercise.equipment} options={EQUIPMENT_TYPES.map((e) => ({ value: e, label: e }))} onChange={(equipment) => setNewExercise({ ...newExercise, equipment })} />
          </Field>
          <Field label="Difficulty">
            <SelectChips size="sm" value={newExercise.difficulty} options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} onChange={(difficulty) => setNewExercise({ ...newExercise, difficulty })} />
          </Field>
          <Field label="Instructions (Optional)">
            <TextInput
              className="min-h-[80px] rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground"
              placeholder="Describe how to perform this exercise..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              value={newExercise.instructions}
              onChangeText={(instructions) => setNewExercise({ ...newExercise, instructions })}
            />
          </Field>
          <Button onPress={handleAddExercise}>Add Exercise</Button>
        </View>
      </Dialog>

      <View className="gap-4">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader className="flex-row items-start justify-between">
              <CardTitleRow className="flex-1">
                <Dumbbell size={16} color={colors.foreground} />
                <Text className="text-lg font-medium text-foreground">{exercise.name}</Text>
              </CardTitleRow>
              {exercise.isCustom && <Badge variant="secondary">Custom</Badge>}
            </CardHeader>
            <CardContent className="gap-3">
              <View className="flex-row flex-wrap gap-2">
                <Badge variant="outline">{exercise.muscleGroup}</Badge>
                <Badge variant="outline">{exercise.equipment}</Badge>
                <Badge className={cn('border-transparent', DIFFICULTY_BADGE[exercise.difficulty].box)} textClassName={DIFFICULTY_BADGE[exercise.difficulty].text}>
                  {exercise.difficulty}
                </Badge>
              </View>
              {exercise.instructions ? (
                <View className="flex-row items-start gap-1">
                  <Info size={12} color={colors.mutedForeground} style={{ marginTop: 3 }} />
                  <Text className="flex-1 text-sm text-muted-foreground">
                    {exercise.instructions.slice(0, 80)}{exercise.instructions.length > 80 ? '...' : ''}
                  </Text>
                </View>
              ) : null}
              <Button variant="outline" size="sm" onPress={() => {}}>
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </View>

      {filteredExercises.length === 0 && (
        <View className="items-center py-12">
          <Dumbbell size={48} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text className="text-muted-foreground">No exercises found. Try adjusting your filters.</Text>
        </View>
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      {children}
    </View>
  );
}

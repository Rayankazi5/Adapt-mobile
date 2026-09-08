// Mirrors Adapt/components/workout/ActiveWorkout.tsx.
import { Check, Dumbbell, Flame, Timer, Trophy, X, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { cn } from '../../lib/cn';
import { dataService } from '../../services/dataService';
import { addXP, recordActivity, XP_REWARDS } from '../../services/gamification';
import { useTheme } from '../../theme/useTheme';
import { Exercise, WorkoutProgram } from '../../types/workout';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle, CardTitleRow } from '../Card';
import { Progress } from '../Progress';
import { toast } from '../Toast';

interface XPPopup {
  id: number;
  amount: number;
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function ActiveWorkout({ program, onEndWorkout }: { program: WorkoutProgram; onEndWorkout: () => void }) {
  const { colors } = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>(program.exercises.map((ex) => ({ ...ex, completed: false, weight: 0 })));
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [xpPopups, setXpPopups] = useState<XPPopup[]>([]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const showXPPopup = (amount: number) => {
    const id = Date.now();
    setXpPopups((prev) => [...prev, { id, amount }]);
    setTimeout(() => setXpPopups((prev) => prev.filter((p) => p.id !== id)), 1600);
  };

  const handleCompleteExercise = () => {
    const updated = [...exercises];
    updated[currentExerciseIndex] = { ...updated[currentExerciseIndex], completed: true };
    setExercises(updated);

    addXP(XP_REWARDS.COMPLETE_EXERCISE);
    recordActivity();
    showXPPopup(XP_REWARDS.COMPLETE_EXERCISE);

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      toast.success('Exercise completed! Moving to next.');
    } else {
      toast.success('Workout complete! Great job! 💪');
    }
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      toast.message('Exercise skipped');
    }
  };

  const handleUpdateWeight = (exerciseId: string, weight: number) => {
    setExercises(exercises.map((ex) => (ex.id === exerciseId ? { ...ex, weight } : ex)));
  };

  const completedCount = exercises.filter((ex) => ex.completed).length;
  const progress = (completedCount / exercises.length) * 100;
  const currentExercise = exercises[currentExerciseIndex];
  const isWorkoutComplete = completedCount === exercises.length;
  const estimatedCalories = Math.round((elapsedTime / 60) * 5);

  const handleFinishWorkout = async () => {
    setIsTimerRunning(false);
    addXP(XP_REWARDS.COMPLETE_WORKOUT);
    showXPPopup(XP_REWARDS.COMPLETE_WORKOUT);
    recordActivity();

    await dataService.addWorkoutLog({
      name: program.name,
      durationMin: Math.round(elapsedTime / 60),
      intensity: 0,
      caloriesBurned: estimatedCalories,
    });

    toast.success(`Workout done! You burned ~${estimatedCalories} cal and earned ${XP_REWARDS.COMPLETE_WORKOUT} XP!`);
    setTimeout(() => onEndWorkout(), 2000);
  };

  return (
    <View className="gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <View className="flex-1 gap-1">
            <CardTitleRow>
              <Dumbbell size={24} color={colors.primary} />
              <CardTitle>{program.name}</CardTitle>
            </CardTitleRow>
            <Text className="text-sm text-muted-foreground">{program.description}</Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center gap-2">
              <Timer size={20} color={isTimerRunning ? colors.primary : colors.mutedForeground} />
              <Text className={cn('text-2xl font-bold', isTimerRunning ? 'text-primary' : 'text-muted-foreground')}>{formatTime(elapsedTime)}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">~{estimatedCalories} kcal burned</Text>
          </View>
        </CardHeader>
        <CardContent className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-foreground">Progress</Text>
            <Text className="text-sm font-medium text-foreground">
              {completedCount} / {exercises.length} exercises
            </Text>
          </View>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {!isWorkoutComplete ? (
        <Card className="border-primary">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Current Exercise</CardTitle>
            <Badge>{currentExerciseIndex + 1} of {exercises.length}</Badge>
          </CardHeader>
          <CardContent className="gap-6">
            <View>
              <Text className="mb-2 text-2xl font-bold text-foreground">{currentExercise.name}</Text>
              <View className="flex-row flex-wrap gap-2">
                <Badge variant="outline">{currentExercise.muscleGroup}</Badge>
                <Badge variant="outline">{currentExercise.equipment}</Badge>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Stat label="Sets" value={String(currentExercise.sets ?? 0)} />
              <Stat label="Reps" value={String(currentExercise.reps ?? 0)} />
              <View className="flex-1 items-center rounded-lg bg-accent p-3">
                <Text className="mb-1 text-sm text-muted-foreground">Weight (kg)</Text>
                <TextInput
                  className="w-full text-center text-xl font-bold text-foreground"
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  value={currentExercise.weight ? String(currentExercise.weight) : ''}
                  onChangeText={(t) => handleUpdateWeight(currentExercise.id, Number(t) || 0)}
                />
              </View>
            </View>

            <View>
              {xpPopups.map((popup) => <XPFloat key={popup.id} amount={popup.amount} />)}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button variant="outline" onPress={handleSkipExercise} icon={<X size={16} color={colors.foreground} />}>
                    Skip
                  </Button>
                </View>
                <View className="flex-1">
                  <Button onPress={handleCompleteExercise} icon={<Check size={16} color={colors.primaryForeground} />}>
                    Complete
                  </Button>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-green-500 bg-green-50 dark:bg-green-950">
          {xpPopups.map((popup) => <XPFloat key={popup.id} amount={popup.amount} large />)}
          <CardContent className="items-center gap-4 pt-6">
            <Trophy size={64} color="#16a34a" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-foreground">Workout Complete!</Text>
              <Text className="mt-1 text-muted-foreground">Great job! You completed all exercises.</Text>
            </View>
            <View className="w-full max-w-[360px] flex-row gap-3">
              <SummaryStat label="Time" value={formatTime(elapsedTime)} />
              <SummaryStat label="Calories" value={String(estimatedCalories)} icon={<Flame size={16} color="#f97316" />} />
              <SummaryStat label="XP" value={`+${XP_REWARDS.COMPLETE_WORKOUT}`} icon={<Zap size={16} color="#8b5cf6" />} valueClassName="text-violet-500" />
            </View>
            <Button size="lg" className="mt-4" onPress={handleFinishWorkout}>
              Finish Workout
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exercise List</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          {exercises.map((exercise, index) => {
            const isCurrent = index === currentExerciseIndex;
            return (
              <View
                key={exercise.id}
                className={cn(
                  'flex-row items-center justify-between rounded-lg p-3',
                  exercise.completed
                    ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : isCurrent
                      ? 'border border-primary bg-primary/10'
                      : 'bg-accent'
                )}
              >
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className={cn(
                      'h-8 w-8 items-center justify-center rounded-full',
                      exercise.completed ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    {exercise.completed ? (
                      <Check size={16} color="white" />
                    ) : (
                      <Text className={cn('text-sm font-medium', isCurrent ? 'text-primary-foreground' : 'text-foreground')}>{index + 1}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={cn('font-medium text-foreground', exercise.completed && 'text-muted-foreground line-through')}>{exercise.name}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps} reps
                    </Text>
                  </View>
                </View>
                {isCurrent && !exercise.completed && <Badge>In Progress</Badge>}
                {exercise.completed && (
                  <View className="flex-row items-center gap-1">
                    <Zap size={12} color="#16a34a" />
                    <Text className="text-xs font-semibold text-green-600 dark:text-green-400">+{XP_REWARDS.COMPLETE_EXERCISE} XP</Text>
                  </View>
                )}
              </View>
            );
          })}
        </CardContent>
      </Card>
    </View>
  );
}

// Floating "+N XP" that rises and fades, like the web's xp-float keyframes.
function XPFloat({ amount, large }: { amount: number; large?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
  }, [anim]);
  const translateY = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -20, -64] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.2, 0.8] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: large ? 16 : -8, alignItems: 'center', zIndex: 10, transform: [{ translateY }, { scale }], opacity }}
    >
      <View className="flex-row items-center gap-1">
        <Zap size={large ? 20 : 16} color="#a78bfa" />
        <Text className={cn('font-extrabold text-violet-400', large ? 'text-xl' : 'text-base')}>+{amount} XP</Text>
      </View>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-lg bg-accent p-4">
      <Text className="mb-1 text-sm text-muted-foreground">{label}</Text>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );
}

function SummaryStat({ label, value, icon, valueClassName }: { label: string; value: string; icon?: React.ReactNode; valueClassName?: string }) {
  return (
    <View className="flex-1 items-center rounded-lg bg-background p-4">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <View className="flex-row items-center justify-center gap-1">
        {icon}
        <Text className={cn('text-xl font-bold text-foreground', valueClassName)}>{value}</Text>
      </View>
    </View>
  );
}

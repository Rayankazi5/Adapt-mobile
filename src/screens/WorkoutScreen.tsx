// Mirrors Adapt/pages/WorkoutTracking.tsx.
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Tabs } from '../components/Tabs';
import { ActiveWorkout } from '../components/workout/ActiveWorkout';
import { ExerciseLibrary } from '../components/workout/ExerciseLibrary';
import { WorkoutAnalytics } from '../components/workout/WorkoutAnalytics';
import { WorkoutPrograms } from '../components/workout/WorkoutPrograms';
import { WorkoutProgram } from '../types/workout';

type WorkoutTab = 'programs' | 'exercises' | 'analytics';

export function WorkoutScreen() {
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [tab, setTab] = useState<WorkoutTab>('programs');

  const handleStartWorkout = (program: WorkoutProgram) => {
    setActiveProgram(program);
    setIsWorkoutActive(true);
  };

  // Keep activeProgram for history, like the web app
  const handleEndWorkout = () => setIsWorkoutActive(false);

  return (
    <ScrollView className="bg-background" contentContainerClassName="grow gap-6 px-4 pb-8 pt-16" keyboardShouldPersistTaps="handled">
      <View>
        <Text className="text-3xl font-bold text-foreground">Workout Tracking</Text>
        <Text className="text-muted-foreground">Plan your workouts, track progress, and optimize your training</Text>
      </View>

      {isWorkoutActive && activeProgram ? (
        <ActiveWorkout key={activeProgram.id} program={activeProgram} onEndWorkout={handleEndWorkout} />
      ) : (
        <View className="gap-6">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'programs', label: 'Programs' },
              { value: 'exercises', label: 'Exercise Library' },
              { value: 'analytics', label: 'Analytics' },
            ]}
          />
          {tab === 'programs' && <WorkoutPrograms onStartWorkout={handleStartWorkout} />}
          {tab === 'exercises' && <ExerciseLibrary />}
          {tab === 'analytics' && <WorkoutAnalytics />}
        </View>
      )}
    </ScrollView>
  );
}

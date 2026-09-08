// Mirrors Adapt/components/workout/WorkoutPrograms.tsx (program data and
// the suggested-workout exercise database are copied verbatim).
import { Clock, Dumbbell, Play, Plus, Target, Users, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../theme/useTheme';
import { Exercise, WorkoutProgram } from '../../types/workout';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardTitleRow } from '../Card';
import { SelectChips } from '../SelectChips';
import { Tabs } from '../Tabs';

const PPL_PROGRAM: WorkoutProgram[] = [
  {
    id: 'ppl-push', name: 'Push Day', type: 'ppl', description: 'Chest, Shoulders, Triceps', duration: 60,
    exercises: [
      { id: '1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: '3', name: 'Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '4', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: '5', name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', sets: 3, reps: 10 },
      { id: '6', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'ppl-pull', name: 'Pull Day', type: 'ppl', description: 'Back, Biceps', duration: 60,
    exercises: [
      { id: '7', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: '8', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', sets: 4, reps: 8 },
      { id: '9', name: 'Bent Over Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '10', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 15 },
      { id: '11', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 3, reps: 10 },
      { id: '12', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'ppl-legs', name: 'Leg Day', type: 'ppl', description: 'Quads, Hamstrings, Glutes, Calves', duration: 60,
    exercises: [
      { id: '13', name: 'Squat', muscleGroup: 'Quads', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '14', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 4, reps: 10 },
      { id: '15', name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', sets: 3, reps: 12 },
      { id: '16', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: 12 },
      { id: '17', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', sets: 4, reps: 15 },
      { id: '18', name: 'Bulgarian Split Squat', muscleGroup: 'Quads', equipment: 'Dumbbell', sets: 3, reps: 10 },
    ],
  },
];

const FULL_BODY_PROGRAM: WorkoutProgram = {
  id: 'fullbody-1', name: 'Full Body Workout', type: 'fullbody', description: 'Complete full body routine', duration: 60,
  exercises: [
    { id: '19', name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8 },
    { id: '20', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
    { id: '21', name: 'Bent Over Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
    { id: '22', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 3, reps: 10 },
    { id: '23', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 3, reps: 10 },
    { id: '24', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 60 },
  ],
};

const BRO_SPLIT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'bro-chest', name: 'Chest Day', type: 'brosplit', description: 'Focused chest training', duration: 45,
    exercises: [
      { id: '25', name: 'Flat Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '26', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 4, reps: 10 },
      { id: '27', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', sets: 3, reps: 12 },
      { id: '28', name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10 },
    ],
  },
  {
    id: 'bro-back', name: 'Back Day', type: 'brosplit', description: 'Focused back training', duration: 45,
    exercises: [
      { id: '29', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: '30', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', sets: 4, reps: 8 },
      { id: '31', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '32', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'bro-legs', name: 'Leg Day', type: 'brosplit', description: 'Focused leg training', duration: 60,
    exercises: [
      { id: '33', name: 'Squat', muscleGroup: 'Quads', equipment: 'Barbell', sets: 5, reps: 6 },
      { id: '34', name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', sets: 4, reps: 10 },
      { id: '35', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 4, reps: 12 },
      { id: '36', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', sets: 4, reps: 15 },
    ],
  },
  {
    id: 'bro-shoulders', name: 'Shoulder Day', type: 'brosplit', description: 'Focused shoulder training', duration: 45,
    exercises: [
      { id: '37', name: 'Military Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '38', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 12 },
      { id: '39', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15 },
      { id: '40', name: 'Shrugs', muscleGroup: 'Traps', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
  },
  {
    id: 'bro-arms', name: 'Arm Day', type: 'brosplit', description: 'Biceps and Triceps', duration: 45,
    exercises: [
      { id: '41', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 10 },
      { id: '42', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', sets: 4, reps: 10 },
      { id: '43', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: '44', name: 'Overhead Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
  },
];

type Muscle = 'fullbody' | 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const EXERCISE_DATABASE: Record<Muscle, Record<Difficulty, Exercise[]>> = {
  fullbody: {
    beginner: [
      { id: 'fb1', name: 'Bodyweight Squats', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 12 },
      { id: 'fb2', name: 'Push-ups (Knees OK)', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10 },
      { id: 'fb3', name: 'Bent Over Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'fb4', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'fb5', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 30 },
    ],
    intermediate: [
      { id: 'fb6', name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'fb7', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'fb8', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'fb9', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 3, reps: 10 },
      { id: 'fb10', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 3, reps: 10 },
      { id: 'fb11', name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 12 },
    ],
    advanced: [
      { id: 'fb12', name: 'Back Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'fb13', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'fb14', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'fb15', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: 'fb16', name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: 'fb17', name: 'Weighted Pull-ups', muscleGroup: 'Back', equipment: 'Weighted', sets: 4, reps: 8 },
    ],
  },
  chest: {
    beginner: [
      { id: 'ch1', name: 'Push-ups', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 12 },
      { id: 'ch2', name: 'Dumbbell Chest Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'ch3', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'ch4', name: 'Dumbbell Flyes', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
    intermediate: [
      { id: 'ch5', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'ch6', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 4, reps: 10 },
      { id: 'ch7', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', sets: 3, reps: 12 },
      { id: 'ch8', name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10 },
      { id: 'ch9', name: 'Decline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 3, reps: 10 },
    ],
    advanced: [
      { id: 'ch10', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'ch11', name: 'Weighted Dips', muscleGroup: 'Chest', equipment: 'Weighted', sets: 4, reps: 8 },
      { id: 'ch12', name: 'Incline Barbell Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: 'ch13', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', sets: 4, reps: 12 },
      { id: 'ch14', name: 'Decline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
    ],
  },
  back: {
    beginner: [
      { id: 'bk1', name: 'Assisted Pull-ups', muscleGroup: 'Back', equipment: 'Machine', sets: 3, reps: 10 },
      { id: 'bk2', name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'bk3', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12 },
      { id: 'bk4', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 15 },
    ],
    intermediate: [
      { id: 'bk5', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', sets: 4, reps: 8 },
      { id: 'bk6', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'bk7', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12 },
      { id: 'bk8', name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 3, reps: 10 },
      { id: 'bk9', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 15 },
    ],
    advanced: [
      { id: 'bk10', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'bk11', name: 'Weighted Pull-ups', muscleGroup: 'Back', equipment: 'Weighted', sets: 4, reps: 6 },
      { id: 'bk12', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'bk13', name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'bk14', name: 'Rack Pulls', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 6 },
    ],
  },
  legs: {
    beginner: [
      { id: 'lg1', name: 'Bodyweight Squats', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 15 },
      { id: 'lg2', name: 'Lunges', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 12 },
      { id: 'lg3', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', sets: 3, reps: 12 },
      { id: 'lg4', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: 12 },
      { id: 'lg5', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Bodyweight', sets: 3, reps: 15 },
    ],
    intermediate: [
      { id: 'lg6', name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'lg7', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 4, reps: 10 },
      { id: 'lg8', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', sets: 3, reps: 12 },
      { id: 'lg9', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: 12 },
      { id: 'lg10', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'lg11', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', sets: 4, reps: 15 },
    ],
    advanced: [
      { id: 'lg12', name: 'Barbell Back Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'lg13', name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: 'lg14', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'lg15', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 4, reps: 8 },
      { id: 'lg16', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', sets: 4, reps: 10 },
      { id: 'lg17', name: 'Walking Lunges', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 4, reps: 12 },
    ],
  },
  shoulders: {
    beginner: [
      { id: 'sh1', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { id: 'sh2', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: 'sh3', name: 'Front Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: 'sh4', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15 },
    ],
    intermediate: [
      { id: 'sh5', name: 'Barbell Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'sh6', name: 'Dumbbell Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 12 },
      { id: 'sh7', name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: 'sh8', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15 },
      { id: 'sh9', name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10 },
    ],
    advanced: [
      { id: 'sh10', name: 'Military Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 5, reps: 5 },
      { id: 'sh11', name: 'Push Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 6 },
      { id: 'sh12', name: 'Dumbbell Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 15 },
      { id: 'sh13', name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 12 },
      { id: 'sh14', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 4, reps: 20 },
    ],
  },
  arms: {
    beginner: [
      { id: 'ar1', name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: 'ar2', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', sets: 3, reps: 12 },
      { id: 'ar3', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: 'ar4', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
    intermediate: [
      { id: 'ar5', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 10 },
      { id: 'ar6', name: 'Close Grip Bench Press', muscleGroup: 'Triceps', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'ar7', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { id: 'ar8', name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', sets: 3, reps: 10 },
      { id: 'ar9', name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', sets: 3, reps: 12 },
    ],
    advanced: [
      { id: 'ar10', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: 'ar11', name: 'Weighted Dips', muscleGroup: 'Triceps', equipment: 'Weighted', sets: 4, reps: 8 },
      { id: 'ar12', name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 10 },
      { id: 'ar13', name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', sets: 4, reps: 10 },
      { id: 'ar14', name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
  },
  core: {
    beginner: [
      { id: 'co1', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 30 },
      { id: 'co2', name: 'Crunches', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 15 },
      { id: 'co3', name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 12 },
      { id: 'co4', name: 'Bird Dog', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 10 },
    ],
    intermediate: [
      { id: 'co5', name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 4, reps: 12 },
      { id: 'co6', name: 'Cable Crunches', muscleGroup: 'Core', equipment: 'Cable', sets: 3, reps: 15 },
      { id: 'co7', name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 20 },
      { id: 'co8', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 60 },
      { id: 'co9', name: 'Mountain Climbers', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 20 },
    ],
    advanced: [
      { id: 'co10', name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 4, reps: 15 },
      { id: 'co11', name: 'Ab Wheel Rollouts', muscleGroup: 'Core', equipment: 'Ab Wheel', sets: 4, reps: 12 },
      { id: 'co12', name: 'Dragon Flags', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 8 },
      { id: 'co13', name: 'Weighted Cable Crunches', muscleGroup: 'Core', equipment: 'Cable', sets: 4, reps: 15 },
      { id: 'co14', name: 'L-Sit Hold', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 30 },
    ],
  },
  cardio: {
    beginner: [
      { id: 'cd1', name: 'Walking', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 1, reps: 20 },
      { id: 'cd2', name: 'Jumping Jacks', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 20 },
      { id: 'cd3', name: 'Step-ups', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 15 },
      { id: 'cd4', name: 'March in Place', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 30 },
    ],
    intermediate: [
      { id: 'cd5', name: 'Jump Rope', muscleGroup: 'Cardio', equipment: 'Jump Rope', sets: 4, reps: 60 },
      { id: 'cd6', name: 'Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 4, reps: 10 },
      { id: 'cd7', name: 'High Knees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 4, reps: 30 },
      { id: 'cd8', name: 'Mountain Climbers', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 4, reps: 20 },
    ],
    advanced: [
      { id: 'cd9', name: 'Sprints', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 6, reps: 30 },
      { id: 'cd10', name: 'Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 5, reps: 15 },
      { id: 'cd11', name: 'Box Jumps', muscleGroup: 'Cardio', equipment: 'Box', sets: 4, reps: 12 },
      { id: 'cd12', name: 'Battle Ropes', muscleGroup: 'Cardio', equipment: 'Battle Ropes', sets: 4, reps: 30 },
    ],
  },
};

const MUSCLE_NAMES: Record<Muscle, string> = {
  fullbody: 'Full Body', chest: 'Chest', back: 'Back', legs: 'Legs',
  shoulders: 'Shoulders', arms: 'Arms', core: 'Core', cardio: 'Cardio',
};
const DIFFICULTY_NAMES: Record<Difficulty, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

const MUSCLE_OPTIONS: { value: Muscle; label: string }[] = [
  { value: 'fullbody', label: 'Full Body' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms (Biceps & Triceps)' },
  { value: 'core', label: 'Core / Abs' },
  { value: 'cardio', label: 'Cardio' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to fitness. Focus on learning proper form with lighter weights and basic movements.' },
  { value: 'intermediate', label: 'Intermediate', description: '6+ months of consistent training. Comfortable with compound movements and moderate weights.' },
  { value: 'advanced', label: 'Advanced', description: '2+ years of training. Strong technique, pushing heavy weights with advanced exercises.' },
];

type ProgramTab = 'ppl' | 'fullbody' | 'brosplit' | 'custom';

export function WorkoutPrograms({ onStartWorkout }: { onStartWorkout: (program: WorkoutProgram) => void }) {
  const { colors } = useTheme();
  const [timeLimit, setTimeLimit] = useState(60);
  const [customPrograms] = useState<WorkoutProgram[]>([]);
  const [targetMuscle, setTargetMuscle] = useState<Muscle>('fullbody');
  const [difficultyLevel, setDifficultyLevel] = useState<Difficulty>('intermediate');
  const [tab, setTab] = useState<ProgramTab>('ppl');

  const getSuggestedWorkout = (): WorkoutProgram => {
    const selectedExercises = EXERCISE_DATABASE[targetMuscle]?.[difficultyLevel] || [];
    // ~5 minutes per exercise (including rest)
    const maxExercises = Math.floor(timeLimit / 5);
    const exercises = selectedExercises.slice(0, Math.max(3, Math.min(maxExercises, selectedExercises.length)));
    return {
      id: 'suggested-custom',
      name: `${MUSCLE_NAMES[targetMuscle]} Workout - ${DIFFICULTY_NAMES[difficultyLevel]}`,
      type: 'suggested',
      description: `${timeLimit} min ${DIFFICULTY_NAMES[difficultyLevel]} level ${MUSCLE_NAMES[targetMuscle].toLowerCase()} workout`,
      duration: timeLimit,
      exercises,
    };
  };

  const ProgramCard = ({ program }: { program: WorkoutProgram }) => (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <View className="flex-1 gap-1">
          <CardTitleRow>
            <Dumbbell size={20} color={colors.foreground} />
            <CardTitle>{program.name}</CardTitle>
          </CardTitleRow>
          <CardDescription>{program.description}</CardDescription>
        </View>
        <Badge variant="outline">{program.type.toUpperCase()}</Badge>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="flex-row items-center gap-2">
          <Clock size={16} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{program.duration} minutes</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Target size={16} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{program.exercises.length} exercises</Text>
        </View>
        <Button className="mt-2" onPress={() => onStartWorkout(program)} icon={<Play size={16} color={colors.primaryForeground} />}>
          Start Workout
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <View className="gap-6">
      <Card className="border-primary">
        <CardHeader>
          <CardTitleRow>
            <Zap size={20} color={colors.primary} />
            <CardTitle>Suggested Workout</CardTitle>
          </CardTitleRow>
          <CardDescription>Get a workout tailored to your available time and goals</CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">How much time do you have? (minutes)</Text>
            <TextInput
              className="h-10 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
              keyboardType="number-pad"
              value={String(timeLimit)}
              onChangeText={(t) => setTimeLimit(Number(t) || 0)}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">What do you wanna train?</Text>
            <SelectChips size="sm" value={targetMuscle} options={MUSCLE_OPTIONS} onChange={setTargetMuscle} />
          </View>

          <View className="gap-3">
            <Text className="text-sm font-medium text-foreground">Difficulty Level</Text>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const selected = difficultyLevel === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setDifficultyLevel(opt.value)}
                  className={cn('flex-row items-start gap-3 rounded-lg border border-border p-3', selected && 'bg-accent')}
                >
                  <View className={cn('mt-0.5 h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-primary' : 'border-muted-foreground')}>
                    {selected && <View className="h-2 w-2 rounded-full bg-primary" />}
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-medium text-foreground">{opt.label}</Text>
                    <Text className="text-xs text-muted-foreground">{opt.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button onPress={() => onStartWorkout(getSuggestedWorkout())} icon={<Zap size={16} color={colors.primaryForeground} />}>
            Get Suggested Workout
          </Button>
        </CardContent>
      </Card>

      <View className="gap-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'ppl', label: 'Push/Pull/Legs' },
            { value: 'fullbody', label: 'Full Body' },
            { value: 'brosplit', label: 'Bro Split' },
            { value: 'custom', label: 'Custom' },
          ]}
        />

        {tab === 'ppl' && (
          <View className="gap-4">
            <Text className="text-sm text-muted-foreground">Classic 3-day split focusing on push muscles, pull muscles, and legs</Text>
            {PPL_PROGRAM.map((p) => <ProgramCard key={p.id} program={p} />)}
          </View>
        )}
        {tab === 'fullbody' && (
          <View className="gap-4">
            <Text className="text-sm text-muted-foreground">Complete full body workout hitting all major muscle groups</Text>
            <ProgramCard program={FULL_BODY_PROGRAM} />
          </View>
        )}
        {tab === 'brosplit' && (
          <View className="gap-4">
            <Text className="text-sm text-muted-foreground">5-day split focusing on one muscle group per day</Text>
            {BRO_SPLIT_PROGRAMS.map((p) => <ProgramCard key={p.id} program={p} />)}
          </View>
        )}
        {tab === 'custom' && (
          <View className="gap-4">
            <Text className="text-sm text-muted-foreground">Create your own custom workout programs</Text>
            <Card>
              <CardHeader>
                <CardTitle>Create Custom Program</CardTitle>
                <CardDescription>Build a personalized workout from the exercise library</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onPress={() => {}} icon={<Plus size={16} color={colors.primaryForeground} />}>
                  Create New Program
                </Button>
              </CardContent>
            </Card>
            {customPrograms.length === 0 ? (
              <View className="items-center py-8">
                <Users size={48} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text className="text-muted-foreground">No custom programs yet. Create one to get started!</Text>
              </View>
            ) : (
              customPrograms.map((p) => <ProgramCard key={p.id} program={p} />)
            )}
          </View>
        )}
      </View>
    </View>
  );
}

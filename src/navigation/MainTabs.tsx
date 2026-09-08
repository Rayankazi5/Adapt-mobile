import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Apple, Dumbbell, Home, UserCircle } from 'lucide-react-native';
import React, { ComponentType } from 'react';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LogMealScreen } from '../screens/LogMealScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { useTheme } from '../theme/useTheme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Same icon set as Adapt/components/Navigation.tsx (lucide-react -> lucide-react-native).
const ICONS: Record<keyof MainTabParamList, ComponentType<{ size?: number; color?: string }>> = {
  Dashboard: Home,
  LogMeal: Apple,
  Workout: Dumbbell,
  Profile: UserCircle,
};

export function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const Icon = ICONS[route.name];
          return <Icon size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="LogMeal" component={LogMealScreen} options={{ title: 'Calories' }} />
      <Tab.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Workouts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

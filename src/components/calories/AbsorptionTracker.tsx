// Mirrors Adapt/components/calories/AbsorptionTracker.tsx (recharts ->
// src/components/charts/SimpleCharts).
import { BarChart3, Calendar, TrendingDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';
import { useTheme } from '../../theme/useTheme';
import { MealLog } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardTitleRow } from '../Card';
import { SimpleBarChart, SimpleLineChart } from '../charts/SimpleCharts';
import { Progress } from '../Progress';
import { Tabs } from '../Tabs';

export function AbsorptionTracker({ foodLogs }: { foodLogs: MealLog[] }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');

  const totalLogged = foodLogs.reduce((sum, log) => sum + log.entries.reduce((s, e) => s + e.calories, 0), 0);

  // Absorption rate varies by food type, digestion health, etc. — ~85% for this demo
  const absorptionRate = 0.85;
  const effectiveCalories = Math.round(totalLogged * absorptionRate);
  const unabsorbedCalories = totalLogged - effectiveCalories;

  // Mock weekly data (matches the web app)
  const weeklyData = [
    { label: 'Mon', logged: 1950, effective: 1658, absorption: 85 },
    { label: 'Tue', logged: 2100, effective: 1785, absorption: 85 },
    { label: 'Wed', logged: 1850, effective: 1573, absorption: 85 },
    { label: 'Thu', logged: 2050, effective: 1743, absorption: 85 },
    { label: 'Fri', logged: 2200, effective: 1870, absorption: 85 },
    { label: 'Sat', logged: 2300, effective: 1955, absorption: 85 },
    { label: 'Sun', logged: totalLogged, effective: effectiveCalories, absorption: Math.round(absorptionRate * 100) },
  ];

  const avg = (k: 'logged' | 'effective' | 'absorption') =>
    Math.round(weeklyData.reduce((sum, d) => sum + d[k], 0) / weeklyData.length);
  const weeklyAverage = { logged: avg('logged'), effective: avg('effective'), absorption: avg('absorption') };

  return (
    <View className="gap-4">
      <Card>
        <CardHeader>
          <CardTitleRow>
            <TrendingDown size={20} color="#22c55e" />
            <CardTitle>Absorption Tracker</CardTitle>
          </CardTitleRow>
          <CardDescription>Track the difference between consumed and absorbed calories</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
          />

          {tab === 'daily' ? (
            <View className="gap-4">
              <View className="gap-3">
                <MiniStat title="Logged Calories" value={`${totalLogged}`} caption="Total consumed" />
                <MiniStat title="Effective Calories" value={`${effectiveCalories}`} caption="Actually absorbed" valueClassName="text-green-600" />
                <MiniStat title="Not Absorbed" value={`${unabsorbedCalories}`} caption="Passed through" valueClassName="text-orange-600" />
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">Absorption Rate</Text>
                  <Text className="text-sm text-muted-foreground">{Math.round(absorptionRate * 100)}%</Text>
                </View>
                <Progress value={absorptionRate * 100} className="h-3" />
                <Text className="text-xs text-muted-foreground">
                  Your body is absorbing {Math.round(absorptionRate * 100)}% of consumed calories
                </Text>
              </View>

              <View className="gap-2 rounded-lg bg-accent p-4">
                <Text className="text-sm font-medium text-foreground">Factors Affecting Absorption:</Text>
                {[
                  'Gut health and microbiome diversity',
                  'Food processing and cooking methods',
                  'Fiber content (high fiber reduces absorption)',
                  'Meal timing and combinations',
                  'Individual metabolic rate',
                ].map((f) => (
                  <Text key={f} className="text-sm text-muted-foreground">• {f}</Text>
                ))}
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <View className="gap-3">
                <MiniStat title="Avg Logged" value={`${weeklyAverage.logged}`} caption="kcal/day" />
                <MiniStat title="Avg Effective" value={`${weeklyAverage.effective}`} caption="kcal/day" valueClassName="text-green-600" />
                <MiniStat title="Avg Absorption" value={`${weeklyAverage.absorption}%`} caption="This week" />
              </View>
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">Weekly Absorption Trend</Text>
                  <Text className="text-sm text-muted-foreground">{weeklyAverage.absorption}% average</Text>
                </View>
                <Progress value={weeklyAverage.absorption} className="h-3" />
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitleRow>
            <BarChart3 size={20} color={colors.foreground} />
            <CardTitle>Logged vs Effective Calories</CardTitle>
          </CardTitleRow>
          <CardDescription>7-day comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={weeklyData}
            height={300}
            series={[
              { key: 'logged', name: 'Logged Calories', color: '#3b82f6' },
              { key: 'effective', name: 'Effective Calories', color: '#10b981' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitleRow>
            <Calendar size={20} color={colors.foreground} />
            <CardTitle>Absorption Rate Trend</CardTitle>
          </CardTitleRow>
          <CardDescription>Weekly absorption percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleLineChart
            data={weeklyData}
            height={250}
            domain={[75, 95]}
            series={[{ key: 'absorption', name: 'Absorption Rate (%)', color: '#8b5cf6' }]}
          />
        </CardContent>
      </Card>
    </View>
  );
}

function MiniStat({ title, value, caption, valueClassName }: { title: string; value: string; caption: string; valueClassName?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <Text className="text-sm font-medium text-muted-foreground">{title}</Text>
      </CardHeader>
      <CardContent>
        <Text className={cn('text-2xl font-bold text-foreground', valueClassName)}>{value}</Text>
        <Text className="mt-1 text-xs text-muted-foreground">{caption}</Text>
      </CardContent>
    </Card>
  );
}

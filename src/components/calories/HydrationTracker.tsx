// Mirrors Adapt/components/calories/HydrationTracker.tsx
// (navigator.geolocation -> expo-location; same open-meteo endpoint).
import * as Location from 'expo-location';
import { Bell, Droplets, Dumbbell, MapPin, Minus, Plus, RefreshCw, Thermometer, Wind } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { cn } from '../../lib/cn';
import { dataService } from '../../services/dataService';
import { profileService } from '../../services/profileService';
import { useTheme } from '../../theme/useTheme';
import { HydroInputs, HydroIntensity } from '../../types';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitleRow } from '../Card';
import { Progress } from '../Progress';
import { SelectChips } from '../SelectChips';
import { toast } from '../Toast';

type WeatherStatus = 'idle' | 'fetching' | 'live' | 'denied' | 'error';

class LocationDeniedError extends Error {
  code = 1;
}

async function fetchLiveWeather(): Promise<{ tempC: number; humidity: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new LocationDeniedError('Location permission denied');

  const cached = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
  const pos = cached ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  const { latitude, longitude } = pos.coords;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
    `&current=temperature_2m,relative_humidity_2m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API error');
  const json = await res.json();
  return {
    tempC: Math.round(json.current.temperature_2m),
    humidity: Math.round(json.current.relative_humidity_2m),
  };
}

const GLASS_ML = 250;

function computeRecommendation(
  inputs: HydroInputs,
  workoutDurationMins: number,
  weightKg: number,
  consumedMl: number,
  workoutWaterMl: number
) {
  let totalMl = weightKg * 35;
  if (inputs.tempC > 30) totalMl += 500;
  if (inputs.humidity > 70) totalMl += 300;

  const intensityAdj: Record<HydroIntensity, number> = { none: 0, low: 300, moderate: 500, high: 800 };
  totalMl += intensityAdj[inputs.intensity];
  totalMl += Math.floor(workoutDurationMins / 30) * 200;

  const workoutReqMl = intensityAdj[inputs.intensity] + Math.floor(workoutDurationMins / 30) * 200;
  const remainingMl = Math.max(0, totalMl - consumedMl);
  const deficit = totalMl - consumedMl;
  const status: 'Normal' | 'Mild deficit' | 'High deficit' =
    deficit <= 500 ? 'Normal' : deficit <= 1000 ? 'Mild deficit' : 'High deficit';
  const reminder = deficit > 1000 ? 'Every 20 min' : deficit >= 500 ? 'Every 40 min' : 'Every 60 min';
  const glasses = Math.ceil(remainingMl / GLASS_ML);

  const workoutDehydrated = inputs.intensity !== 'none' && workoutReqMl > 0 && workoutWaterMl < workoutReqMl * 0.7;

  let advice: string;
  if (deficit <= 0) {
    advice = "You're fully hydrated. Keep sipping steadily through the rest of the day.";
  } else if (workoutDehydrated) {
    advice = `Workout hydration deficit — you drank ${workoutWaterMl} ml but needed ~${workoutReqMl} ml. Drink ${Math.ceil((workoutReqMl - workoutWaterMl) / GLASS_ML)} glasses now to recover.`;
  } else if (inputs.tempC > 30 && inputs.humidity > 70) {
    advice = `Hot and humid — sweat rate is high. Front-load ${glasses} glasses before evening; avoid waiting until thirsty.`;
  } else if (inputs.tempC > 30) {
    advice = `High heat adds ~500 ml extra demand. Spread ${glasses} glasses evenly over the next ${Math.round(glasses * 20)} min.`;
  } else if (inputs.intensity === 'high') {
    advice = `High-intensity session increases fluid loss significantly. Drink ${glasses} glasses within the next 2 hours.`;
  } else {
    advice = `${glasses} glass${glasses !== 1 ? 'es' : ''} remaining. Aim for one every ${reminder.split(' ').slice(-2).join(' ')}.`;
  }

  return { totalMl, consumedMl, remainingMl, glasses, workoutReqMl, status, reminder, advice };
}

const INTENSITY_OPTIONS: { value: HydroIntensity; label: string }[] = [
  { value: 'none', label: 'No workout' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
];

export function HydrationTracker({ onChange }: { onChange?: () => void }) {
  const { colors } = useTheme();
  const [hydration, setHydration] = useState({ consumed: 0, goal: 8 });
  const [inputs, setInputs] = useState<HydroInputs>({ tempC: 28, humidity: 60, intensity: 'none' });
  const [weightKg, setWeightKg] = useState(70);
  const [workoutDurationMins, setWorkoutDurationMins] = useState(0);
  const [workoutWaterMl, setWorkoutWaterMl] = useState(0);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('idle');
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [h, saved, user, workouts] = await Promise.all([
        dataService.getHydration(),
        dataService.getHydroInputs(),
        profileService.getProfile(),
        dataService.getWorkoutLogs(),
      ]);
      setHydration(h);
      setInputs(saved);
      if (user) setWeightKg(user.weightKg);
      setWorkoutDurationMins(workouts.reduce((sum, w) => sum + w.durationMin, 0));
    })();
  }, []);

  const refreshWeather = useCallback(async () => {
    setWeatherStatus('fetching');
    try {
      const { tempC, humidity } = await fetchLiveWeather();
      setInputs((prev) => {
        const next = { ...prev, tempC, humidity };
        dataService.saveHydroInputs(next);
        return next;
      });
      setWeatherUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWeatherStatus('live');
    } catch (err: unknown) {
      const isDenied = (err as { code?: number })?.code === 1;
      setWeatherStatus(isDenied ? 'denied' : 'error');
      if (isDenied) toast.error('Location access denied — enable it in Settings to use live weather.');
      else toast.error('Could not fetch weather. Check your connection.');
    }
  }, []);

  // Auto-fetch on mount; refresh every 30 min
  useEffect(() => {
    refreshWeather();
    const id = setInterval(refreshWeather, 30 * 60_000);
    return () => clearInterval(id);
  }, [refreshWeather]);

  const updateInputs = (next: HydroInputs) => {
    setInputs(next);
    dataService.saveHydroInputs(next);
  };

  const consumedMl = hydration.consumed * GLASS_ML;
  const rec = useMemo(
    () => computeRecommendation(inputs, workoutDurationMins, weightKg, consumedMl, workoutWaterMl),
    [inputs, workoutDurationMins, weightKg, consumedMl, workoutWaterMl]
  );
  const recommendedGoal = Math.ceil(rec.totalMl / GLASS_ML);

  const { consumed, goal } = hydration;
  const progress = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const remainingGlasses = Math.max(0, goal - consumed);

  const persist = (next: { consumed: number; goal: number }) => {
    setHydration(next);
    dataService.saveHydration(next.consumed, next.goal).then(onChange);
  };

  const applyRecommendedGoal = () => {
    persist({ consumed, goal: recommendedGoal });
    toast.success(`Goal updated to ${recommendedGoal} glasses (${rec.totalMl} ml)`);
  };

  const updateHydration = (newConsumed: number, newGoal = goal) => {
    persist({ consumed: Math.max(0, Math.min(newConsumed, newGoal + 5)), goal: newGoal });
  };

  const addGlass = () => {
    updateHydration(consumed + 1);
    toast.success('Added 1 glass of water!');
  };
  const removeGlass = () => updateHydration(consumed - 1);

  const statusColor = { Normal: 'text-green-500', 'Mild deficit': 'text-yellow-500', 'High deficit': 'text-red-500' }[rec.status];

  return (
    <Card>
      <CardHeader>
        <CardTitleRow>
          <Droplets size={20} color="#3b82f6" />
          <Text className="text-base font-medium text-foreground">Hydration Tracker</Text>
        </CardTitleRow>
      </CardHeader>
      <CardContent className="gap-5">
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Today's Progress</Text>
            <Text className="text-sm text-muted-foreground">
              {consumed} / {goal} glasses
            </Text>
          </View>
          <Progress value={progress} className="h-3" />
          <Text className="text-xs text-muted-foreground">
            {remainingGlasses === 0 ? '🎉 Goal achieved!' : `${remainingGlasses} glass${remainingGlasses !== 1 ? 'es' : ''} remaining`}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button variant="outline" size="sm" onPress={removeGlass} disabled={consumed === 0} icon={<Minus size={16} color={colors.foreground} />}>
              Remove
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={addGlass} icon={<Plus size={16} color={colors.primaryForeground} />}>
              Add Glass
            </Button>
          </View>
        </View>

        <View className="gap-3 border-t border-border pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Smart Recommendation Inputs</Text>
            <View className="flex-row items-center gap-2">
              {weatherStatus === 'live' && weatherUpdatedAt && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={12} color="#22c55e" />
                  <Text className="text-[10px] font-medium text-green-500">Live · {weatherUpdatedAt}</Text>
                </View>
              )}
              {weatherStatus === 'fetching' && <Text className="text-[10px] text-muted-foreground">Fetching weather…</Text>}
              {(weatherStatus === 'denied' || weatherStatus === 'error') && (
                <Text className="text-[10px] text-yellow-500">Manual mode</Text>
              )}
              <Pressable onPress={refreshWeather} disabled={weatherStatus === 'fetching'} className="h-6 w-6 items-center justify-center">
                <RefreshCw size={12} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <LabelRow icon={<Thermometer size={12} color={colors.mutedForeground} />} text="Temperature (°C)" />
              <NumberInput value={inputs.tempC} onChange={(v) => updateInputs({ ...inputs, tempC: v })} />
            </View>
            <View className="flex-1 gap-1.5">
              <LabelRow icon={<Wind size={12} color={colors.mutedForeground} />} text="Humidity (%)" />
              <NumberInput value={inputs.humidity} onChange={(v) => updateInputs({ ...inputs, humidity: v })} />
            </View>
          </View>

          <View className="gap-1.5">
            <LabelRow icon={<Dumbbell size={12} color={colors.mutedForeground} />} text="Workout Intensity" />
            <SelectChips size="sm" value={inputs.intensity} options={INTENSITY_OPTIONS} onChange={(v) => updateInputs({ ...inputs, intensity: v })} />
          </View>
          <View className="gap-1.5">
            <Text className="text-xs text-foreground">Water during workout (ml)</Text>
            <NumberInput value={workoutWaterMl} onChange={setWorkoutWaterMl} placeholder="0" />
          </View>
        </View>

        <View className="gap-3 border-t border-border pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</Text>
            <Text className={cn('text-xs font-bold', statusColor)}>{rec.status}</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Stat label="Target" value={`${rec.totalMl} ml`} />
            <Stat label="Consumed" value={`${rec.consumedMl} ml`} />
            <Stat label="Remaining" value={`${rec.remainingMl} ml`} />
            <Stat label="Glasses left" value={`${rec.glasses}`} />
          </View>

          <View className="flex-row items-center gap-2 rounded-lg bg-muted p-2">
            <Bell size={14} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">
              Remind: <Text className="font-medium text-foreground">{rec.reminder}</Text>
            </Text>
          </View>

          <Text className="text-xs leading-relaxed text-muted-foreground">{rec.advice}</Text>

          {recommendedGoal !== goal && (
            <Button variant="outline" size="sm" onPress={applyRecommendedGoal}>
              Apply recommended goal ({recommendedGoal} glasses)
            </Button>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

function LabelRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center gap-1">
      {icon}
      <Text className="text-xs text-foreground">{text}</Text>
    </View>
  );
}

function NumberInput({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  const { colors } = useTheme();
  return (
    <TextInput
      className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
      keyboardType="number-pad"
      value={value === 0 && placeholder ? '' : String(value)}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      onChangeText={(t) => onChange(Number(t) || 0)}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-0.5 rounded-lg bg-muted p-2">
      <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}

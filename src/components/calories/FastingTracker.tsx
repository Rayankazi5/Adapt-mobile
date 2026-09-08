// Mirrors Adapt/components/calories/FastingTracker.tsx.
import { AlertTriangle, Clock, Play, Sparkles, Square, TrendingUp, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  personalizeWindow,
  recommendFastingPlan,
  type ActivityLevel,
  type AdherenceData,
  type FastingGoal,
  type UserFastingProfile,
} from '../../engines/fastingEngine';
import { cn } from '../../lib/cn';
import { dataService, getTodayKey } from '../../services/dataService';
import { profileService } from '../../services/profileService';
import { useTheme } from '../../theme/useTheme';
import { FastingState } from '../../types';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitleRow } from '../Card';
import { Progress } from '../Progress';
import { toast } from '../Toast';

const PRESET_HOURS = [12, 14, 16, 18, 20];

function elapsedHours(startTime: number | null): number {
  if (!startTime) return 0;
  return Math.max(0, (Date.now() - startTime) / 3_600_000);
}

function fmtDuration(totalHours: number): string {
  const totalSecs = Math.floor(totalHours * 3600);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MODE_STYLE = {
  normal: { box: 'border-blue-200/60 bg-blue-50/30 dark:bg-blue-950/20', Icon: TrendingUp, color: '#3b82f6' },
  upgrade: { box: 'border-yellow-200/60 bg-yellow-50/30 dark:bg-yellow-950/20', Icon: Zap, color: '#eab308' },
  recovery: { box: 'border-orange-200/60 bg-orange-50/30 dark:bg-orange-950/20', Icon: AlertTriangle, color: '#f97316' },
};

export function FastingTracker({ onChange }: { onChange?: () => void }) {
  const { colors } = useTheme();
  const [fasting, setFasting] = useState<FastingState>({ startTime: null, goalHours: 16 });
  const [elapsed, setElapsed] = useState(0);
  const [profile, setProfile] = useState<UserFastingProfile | null>(null);
  const [adherence, setAdherence] = useState<AdherenceData>({ sessions: [], missed_fast_count: 0, early_break_count: 0 });
  const [customHours, setCustomHours] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAdherence = useCallback(async () => {
    const sessions = await dataService.getFastingHistory();
    setAdherence({
      sessions,
      missed_fast_count: sessions.filter((s) => !s.completed).length,
      early_break_count: sessions.filter((s) => !s.completed && s.actual_hours > 0).length,
    });
  }, []);

  useEffect(() => {
    (async () => {
      const [state, prefs, user] = await Promise.all([
        dataService.getFasting(),
        dataService.getFastingPrefs(),
        profileService.getProfile(),
      ]);
      setFasting(state);
      setElapsed(elapsedHours(state.startTime));

      const base: UserFastingProfile = {
        goal: 'maintenance',
        experience_level: prefs.experience_level ?? 'beginner',
        sleep_time: prefs.sleep_time ?? '23:00',
        wake_time: prefs.wake_time ?? '07:00',
        activity_level: 'moderate',
      };
      if (user) {
        const goalMap: Record<string, FastingGoal> = { cut: 'fat_loss', bulk: 'muscle_gain', maintain: 'maintenance' };
        const actMap: Record<string, ActivityLevel> = {
          sedentary: 'low', light: 'low', moderate: 'moderate', active: 'high', very_active: 'high',
        };
        setProfile({
          ...base,
          goal: goalMap[user.goal] ?? 'maintenance',
          activity_level: actMap[user.activityLevel] ?? 'moderate',
          weight_kg: user.weightKg,
        });
      } else {
        setProfile(base);
      }
      await loadAdherence();
    })();
  }, [loadAdherence]);

  // Live timer tick every second while fasting
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (fasting.startTime) {
      setElapsed(elapsedHours(fasting.startTime));
      timerRef.current = setInterval(() => setElapsed(elapsedHours(fasting.startTime)), 1_000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fasting.startTime]);

  const rec = useMemo(() => (profile ? recommendFastingPlan(profile, adherence) : null), [profile, adherence]);

  const selectedWindow = useMemo(
    () => (profile ? personalizeWindow(profile.wake_time, profile.sleep_time, fasting.goalHours) : null),
    [profile, fasting.goalHours]
  );

  const isFasting = fasting.startTime !== null;
  const progress = fasting.goalHours > 0 ? Math.min((elapsed / fasting.goalHours) * 100, 100) : 0;
  const remaining = Math.max(0, fasting.goalHours - elapsed);
  const goalHit = isFasting && elapsed >= fasting.goalHours;

  const update = (next: FastingState) => {
    setFasting(next);
    dataService.saveFasting(next).then(onChange);
  };

  const selectHours = (h: number) => {
    if (isFasting) return;
    update({ ...fasting, goalHours: Math.min(23, Math.max(1, h)) });
    setCustomHours('');
  };

  const applyCustom = () => {
    const h = parseInt(customHours, 10);
    if (!isNaN(h) && h >= 1 && h <= 23) selectHours(h);
  };

  const startFast = () => {
    update({ ...fasting, startTime: Date.now() });
    toast.success(
      `${fasting.goalHours}:${24 - fasting.goalHours} fast started!` +
        (selectedWindow ? ` Eating window: ${selectedWindow.start_time} – ${selectedWindow.end_time}.` : '')
    );
  };

  const endFast = async () => {
    const actual = elapsed;
    const completed = actual >= fasting.goalHours * 0.9;
    await dataService.recordFastingSession({
      date: getTodayKey(),
      completed,
      target_hours: fasting.goalHours,
      actual_hours: parseFloat(actual.toFixed(2)),
    });
    toast.success(
      completed
        ? `Fast complete — ${fmtDuration(actual)}. Great work!`
        : `Fast ended at ${fmtDuration(actual)} (target: ${fasting.goalHours} h).`
    );
    update({ ...fasting, startTime: null });
    loadAdherence();
  };

  const startedAt = fasting.startTime ? new Date(fasting.startTime) : null;
  const history = adherence.sessions.slice(-7);
  const paddedDots = [...Array(Math.max(0, 7 - history.length)).fill(null), ...history];
  const mode = rec ? MODE_STYLE[rec.mode] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitleRow>
          <Clock size={20} color="#a855f7" />
          <Text className="text-base font-medium text-foreground">Fasting Tracker</Text>
        </CardTitleRow>
      </CardHeader>
      <CardContent className="gap-5">
        {rec && mode && (
          <View className={cn('gap-2 rounded-xl border p-3', mode.box)}>
            <View className="flex-row flex-wrap items-center gap-1.5">
              <mode.Icon size={14} color={mode.color} />
              <Text className="text-sm font-semibold text-foreground">Recommended for you: {rec.recommended_plan}</Text>
              <Text className="text-[10px] text-muted-foreground">
                (fast {rec.end_time}–{rec.start_time})
              </Text>
            </View>
            <Text className="text-xs leading-relaxed text-muted-foreground">{rec.reasoning}</Text>
            <View className="flex-row items-start gap-1.5 border-t border-border pt-1">
              <TrendingUp size={12} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs text-muted-foreground">{rec.next_step}</Text>
            </View>
          </View>
        )}

        {!isFasting && (
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Fasting Duration</Text>
            <View className="flex-row flex-wrap items-center gap-2">
              {PRESET_HOURS.map((h) => {
                const isSelected = fasting.goalHours === h;
                const isRecHours = rec?.fasting_hours === h;
                return (
                  <Pressable
                    key={h}
                    onPress={() => selectHours(h)}
                    className={cn(
                      'relative rounded-lg border px-3 py-1.5',
                      isSelected ? 'border-primary bg-primary' : 'border-border bg-muted/30'
                    )}
                  >
                    <Text className={cn('text-sm font-medium', isSelected ? 'text-primary-foreground' : 'text-foreground')}>{h}h</Text>
                    {isRecHours && (
                      <View className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-400">
                        <Sparkles size={8} color="#713f12" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
              <View className="flex-row items-center gap-1.5">
                <TextInput
                  className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                  placeholder="Custom"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  value={customHours}
                  onChangeText={setCustomHours}
                  onSubmitEditing={applyCustom}
                />
                <Button size="sm" variant="outline" onPress={applyCustom} disabled={!customHours}>
                  Set
                </Button>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Clock size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">
                {fasting.goalHours}h fast · {selectedWindow ? `${selectedWindow.end_time} – ${selectedWindow.start_time}` : '—'}
              </Text>
            </View>
          </View>
        )}

        {isFasting ? (
          <View className="items-center gap-3 rounded-xl bg-muted p-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {goalHit ? 'Goal reached!' : 'Elapsed'}
            </Text>
            <Text className={cn('font-mono text-4xl font-bold tracking-tight', goalHit ? 'text-green-500' : 'text-foreground')}>
              {fmtDuration(elapsed)}
            </Text>
            <Progress value={progress} />
            <View className="w-full flex-row justify-between">
              <Text className="text-xs text-muted-foreground">{fasting.goalHours}h goal</Text>
              {goalHit ? (
                <Text className="text-xs font-medium text-green-500">🎉 Fasting goal reached!</Text>
              ) : (
                <Text className="text-xs text-muted-foreground">{fmtDuration(remaining)} remaining</Text>
              )}
            </View>
          </View>
        ) : (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-foreground">Fasting Progress</Text>
              <Text className="text-sm text-muted-foreground">{fasting.goalHours}h selected</Text>
            </View>
            <Progress value={0} />
            <Text className="text-xs text-muted-foreground">Press Start Fast to begin.</Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button disabled={isFasting} onPress={startFast} icon={<Play size={16} color={colors.primaryForeground} />}>
              Start {fasting.goalHours}:{String(24 - fasting.goalHours).padStart(2, '0')} Fast
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="outline" disabled={!isFasting} onPress={endFast} icon={<Square size={16} color={colors.foreground} />}>
              Finish Fast
            </Button>
          </View>
        </View>

        {isFasting && startedAt && (
          <View className="gap-1 border-t border-border pt-3">
            <Row label="Started at:" value={fmt(startedAt)} />
            <Row label="Eating window opens:" value={selectedWindow?.start_time ?? '—'} valueClassName={goalHit ? 'text-green-500' : undefined} />
            <Row label="Eating window closes:" value={selectedWindow?.end_time ?? '—'} />
          </View>
        )}

        {history.length > 0 && (
          <View className="border-t border-border pt-3">
            <Text className="mb-2 text-xs text-muted-foreground">Last 7 days</Text>
            <View className="flex-row items-center gap-1.5">
              {paddedDots.map((s, i) =>
                s === null ? (
                  <View key={i} className="h-6 w-6 rounded-full bg-muted" />
                ) : (
                  <View key={i} className={cn('h-6 w-6 items-center justify-center rounded-full', s.completed ? 'bg-green-500' : 'bg-red-400')}>
                    <Text className="text-[9px] font-bold text-white">{s.completed ? '✓' : '✗'}</Text>
                  </View>
                )
              )}
              <Text className="ml-1 text-xs text-muted-foreground">
                {history.filter((s) => s.completed).length}/{history.length} completed
              </Text>
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={cn('text-sm font-medium text-foreground', valueClassName)}>{value}</Text>
    </View>
  );
}

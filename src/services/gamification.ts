// Async port of Adapt/lib/gamification.ts (localStorage -> AsyncStorage,
// window events -> subscribe()). Storage keys are identical to the web app.
import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'adapt_xp';
const STREAK_KEY = 'adapt_streak';
const STREAK_DATE_KEY = 'adapt_streak_date';

export const XP_REWARDS = {
  LOG_MEAL: 10,
  COMPLETE_EXERCISE: 25,
  COMPLETE_WORKOUT: 100,
  HIT_CALORIE_TARGET: 50,
  HIT_PROTEIN_TARGET: 50,
} as const;

const XP_PER_LEVEL = 500;

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const readInt = async (key: string) => parseInt((await AsyncStorage.getItem(key)) ?? '0', 10);

export async function getXP(): Promise<number> {
  return readInt(XP_KEY);
}

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export async function addXP(amount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const current = await getXP();
  const oldLevel = getLevelFromXP(current);
  const newXP = current + amount;
  const newLevel = getLevelFromXP(newXP);
  await AsyncStorage.setItem(XP_KEY, String(newXP));
  notify();
  return { newXP, newLevel, leveledUp: newLevel > oldLevel };
}

export async function getLevel(): Promise<number> {
  return getLevelFromXP(await getXP());
}

export async function getXPProgress(): Promise<{ current: number; total: number; percent: number; level: number }> {
  const xp = await getXP();
  const level = getLevelFromXP(xp);
  const levelXP = xp % XP_PER_LEVEL;
  return { current: levelXP, total: XP_PER_LEVEL, percent: (levelXP / XP_PER_LEVEL) * 100, level };
}

export async function getStreak(): Promise<number> {
  const streak = await readInt(STREAK_KEY);
  const streakDate = await AsyncStorage.getItem(STREAK_DATE_KEY);
  if (!streakDate || streak === 0) return 0;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const last = new Date(streakDate).toDateString();

  if (last === today || last === yesterday) return streak;
  return 0; // streak broken
}

export async function recordActivity(): Promise<void> {
  const today = new Date();
  const todayStr = today.toDateString();
  const streakDate = await AsyncStorage.getItem(STREAK_DATE_KEY);

  if (streakDate) {
    const lastStr = new Date(streakDate).toDateString();
    const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString();
    if (lastStr === todayStr) return; // already recorded today

    const current = await readInt(STREAK_KEY);
    await AsyncStorage.setItem(STREAK_KEY, String(lastStr === yesterdayStr ? current + 1 : 1));
  } else {
    await AsyncStorage.setItem(STREAK_KEY, '1');
  }

  await AsyncStorage.setItem(STREAK_DATE_KEY, today.toISOString());
  notify();
}

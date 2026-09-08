// ─── Fasting Recommendation Engine ─────────────────────────
// Three separate layers, each independently testable:
//   1. getBaseFastingHours  — goal + experience → fasting window
//   2. personalizeWindow    — sleep/wake times → eating start/end
//   3. applyAdaptiveLogic   — adherence history → adjust difficulty
// Entry point: recommendFastingPlan(profile, adherence?)

export type FastingGoal      = 'fat_loss' | 'muscle_gain' | 'maintenance';
export type ExperienceLevel  = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel    = 'low' | 'moderate' | 'high';
export type RecommendMode    = 'normal' | 'recovery' | 'upgrade';

export interface UserFastingProfile {
  goal:             FastingGoal;
  experience_level: ExperienceLevel;
  sleep_time:       string;        // "HH:MM" 24-hour
  wake_time:        string;        // "HH:MM" 24-hour
  activity_level:   ActivityLevel;
  weight_kg?:       number;
  gender?:          'male' | 'female';
}

export interface FastingSession {
  date:         string;  // "YYYY-MM-DD"
  completed:    boolean; // reached ≥ 90 % of goal
  target_hours: number;
  actual_hours: number;
}

export interface AdherenceData {
  sessions:          FastingSession[];  // most-recent last
  missed_fast_count: number;
  early_break_count: number;
}

export interface FastingRecommendation {
  recommended_plan:  string;   // "14:10"
  fasting_hours:     number;
  eating_hours:      number;
  start_time:        string;   // eating window open  e.g. "10:00"
  end_time:          string;   // eating window close e.g. "20:00"
  reasoning:         string;
  next_step:         string;
  mode:              RecommendMode;
}

// ─── Helpers ────────────────────────────────────────────────

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toTime(mins: number): string {
  const norm = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
}

function adherenceRate(sessions: FastingSession[], days: number): number {
  const slice = sessions.slice(-days);
  if (slice.length === 0) return 1;
  return slice.filter(s => s.completed).length / slice.length;
}

function consecutiveFails(sessions: FastingSession[]): number {
  let count = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (!sessions[i].completed) count++;
    else break;
  }
  return count;
}

// ─── Layer 1: Base recommendation ───────────────────────────

const BASE_HOURS: Record<FastingGoal, Record<ExperienceLevel, number>> = {
  fat_loss:     { beginner: 12, intermediate: 14, advanced: 16 },
  muscle_gain:  { beginner: 12, intermediate: 12, advanced: 12 },
  maintenance:  { beginner: 12, intermediate: 12, advanced: 14 },
};

export function getBaseFastingHours(goal: FastingGoal, level: ExperienceLevel): number {
  return BASE_HOURS[goal][level];
}

// ─── Layer 2: Time personalisation ──────────────────────────
// Fast always starts 1 h before sleep (fixed anchor).
// Eating window end = sleep - 1 h; eating window start = end - eating_hrs.
// start_time = eating window open, end_time = eating window close (= fast start).

export function personalizeWindow(
  _wake_time:  string,
  sleep_time:  string,
  fasting_hrs: number,
): { start_time: string; end_time: string; eating_hours: number } {
  const eating_hrs = 24 - fasting_hrs;
  const sleepMins  = toMins(sleep_time);

  // Eating closes 1 h before sleep (fast starts here)
  const eatEndMins   = ((sleepMins - 60) + 1440) % 1440;
  // Eating opens eating_hrs before that
  const eatStartMins = ((eatEndMins - eating_hrs * 60) + 1440) % 1440;

  return {
    start_time:   toTime(eatStartMins),
    end_time:     toTime(eatEndMins),
    eating_hours: eating_hrs,
  };
}

// ─── Layer 3: Adaptive logic ─────────────────────────────────

interface AdaptiveResult {
  fasting_hours: number;
  mode:          RecommendMode;
  next_step:     string;
}

export function applyAdaptiveLogic(
  base_hours: number,
  adherence:  AdherenceData,
  profile:    UserFastingProfile,
): AdaptiveResult {
  const { sessions, early_break_count } = adherence;

  // Recovery mode: 3+ consecutive failures OR < 50 % adherence over last 7 days
  const rate7  = adherenceRate(sessions, 7);
  const fails  = consecutiveFails(sessions);

  if (fails >= 3 || (sessions.length >= 7 && rate7 < 0.5)) {
    const recovery_hours = Math.max(12, base_hours - 2);
    return {
      fasting_hours: recovery_hours,
      mode: 'recovery',
      next_step:
        `Focus on completing ${recovery_hours}:${24 - recovery_hours} consistently for 5 days. ` +
        `When you hit 5 in a row, you'll be ready to step back up.`,
    };
  }

  // Upgrade suggestion: > 85 % adherence over 7+ days and goal allows it
  const rate14 = adherenceRate(sessions, 14);
  if (
    sessions.length >= 7 &&
    rate7 >= 0.85 &&
    rate14 >= 0.85 &&
    base_hours < 18 &&
    profile.goal !== 'muscle_gain'
  ) {
    const next_hours = Math.min(18, base_hours + 2);
    return {
      fasting_hours: base_hours, // hold current; next_step prompts upgrade
      mode: 'upgrade',
      next_step:
        `Excellent consistency (${Math.round(rate7 * 100)}% over 7 days). ` +
        `You're ready to try ${next_hours}:${24 - next_hours} — start next Monday.`,
    };
  }

  // Frequent early breaks → reduce
  if (early_break_count >= 3) {
    const reduced = Math.max(12, base_hours - 2);
    return {
      fasting_hours: reduced,
      mode: 'normal',
      next_step:
        `You've broken your fast early ${early_break_count} times recently. ` +
        `Dropping to ${reduced}:${24 - reduced} will help you build an unbroken streak.`,
    };
  }

  // Default: hold
  return {
    fasting_hours: base_hours,
    mode: 'normal',
    next_step:
      `Keep ${base_hours}:${24 - base_hours} consistent for 7 days. ` +
      `Strong adherence unlocks your next progression step.`,
  };
}

// ─── Reasoning generator (personalised, not generic) ────────

function buildReasoning(
  profile:       UserFastingProfile,
  fasting_hours: number,
  mode:          RecommendMode,
  adherence:     AdherenceData,
): string {
  const plan      = `${fasting_hours}:${24 - fasting_hours}`;
  const goalLabel = { fat_loss: 'fat loss', muscle_gain: 'muscle gain', maintenance: 'maintenance' }[profile.goal];
  const rate      = adherenceRate(adherence.sessions, 7);
  const rateStr   = adherence.sessions.length >= 7 ? `${Math.round(rate * 100)}% adherence` : null;

  if (mode === 'recovery') {
    return (
      `Your recent fasting data shows ${consecutiveFails(adherence.sessions)} consecutive missed days` +
      (rateStr ? ` and only ${rateStr} this week` : '') +
      `. Stepping back to ${plan} isn't a setback — it's a reset. ` +
      `Consistent shorter fasts outperform inconsistent longer ones every time.`
    );
  }

  if (mode === 'upgrade') {
    return (
      `You've been ${rateStr ? rateStr + ' ' : ''}highly consistent with ${plan}. ` +
      `Your ${profile.experience_level} experience and ${goalLabel} goal put you in a great position to extend your window.`
    );
  }

  const details: Record<FastingGoal, Record<ExperienceLevel, string>> = {
    fat_loss: {
      beginner:     `12:12 is the entry point for fat loss — it creates a nightly fasting habit without disrupting your energy levels. Once you hit 7 consistent days, 14:10 becomes your next target.`,
      intermediate: `14:10 is the optimal fat-loss window at your level. It's long enough to suppress insulin and start fat oxidation after glycogen depletion, without the hunger spikes of 16:8.`,
      advanced:     `16:8 maximises fat oxidation windows. Your experience means your body handles the extended fast without cortisol spikes or muscle catabolism — provided you hit protein targets in your eating window.`,
    },
    muscle_gain: {
      beginner:     `For muscle gain, 12:12 gives you 12 hours to hit your calorie and protein targets — essential when you're building. Aggressive fasting risks under-eating on training days.`,
      intermediate: `12:12 protects your muscle gain calories. A wider fasting window risks compressing your eating window too much to consume adequate protein and carbs around your workouts.`,
      advanced:     `Even at advanced level, 12:12 is the right call for muscle gain. The anabolic window and nutrient timing matter more than fasting length when your goal is hypertrophy.`,
    },
    maintenance: {
      beginner:     `12:12 aligns your eating with daylight hours, reducing mindless snacking without any calorie restriction. It's a lifestyle tool, not a diet.`,
      intermediate: `12:12 to 14:10 gives you time-restricted eating benefits — metabolic flexibility, improved insulin sensitivity — without aggressive restriction on a maintenance goal.`,
      advanced:     `14:10 provides structured eating boundaries and the metabolic benefits of mild fasting while giving you enough flexibility for social meals and training nutrition.`,
    },
  };

  return details[profile.goal][profile.experience_level];
}

// ─── Main entry point ────────────────────────────────────────

export function recommendFastingPlan(
  profile:   UserFastingProfile,
  adherence: AdherenceData = { sessions: [], missed_fast_count: 0, early_break_count: 0 },
): FastingRecommendation {
  // Layer 1
  const base_hours = getBaseFastingHours(profile.goal, profile.experience_level);

  // Layer 3 (adaptive may override base_hours)
  const adaptive = applyAdaptiveLogic(base_hours, adherence, profile);

  // Layer 2 (use adaptive hours for window calculation)
  const window = personalizeWindow(profile.wake_time, profile.sleep_time, adaptive.fasting_hours);

  // Reasoning
  const reasoning = buildReasoning(profile, adaptive.fasting_hours, adaptive.mode, adherence);

  return {
    recommended_plan: `${adaptive.fasting_hours}:${window.eating_hours}`,
    fasting_hours:    adaptive.fasting_hours,
    eating_hours:     window.eating_hours,
    start_time:       window.start_time,
    end_time:         window.end_time,
    reasoning,
    next_step:        adaptive.next_step,
    mode:             adaptive.mode,
  };
}

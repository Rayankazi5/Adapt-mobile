// ─── Fatigue & Recovery Scoring Engine ──────────────────────
// Inputs: calories, protein, hydration, workouts + meal progress
// Output: fatigue score (0–100) + recovery recommendation
//
// Scoring breakdown (100 pts total):
//   Calorie factor   0–35 pts  — linear: fully eaten = 0, nothing eaten = 35
//   Protein factor   0–25 pts  — linear: fully eaten = 0, nothing eaten = 25
//   Hydration factor 0–20 pts  — linear: fully hydrated = 0, none = 20
//   Workout factor   0–20 pts  — only added once a workout is completed
//
// mealProgress (0–1) scales the effective daily target to the fraction of the
// day's meals that have been logged, so early-day low intake isn't penalised:
//   0.00 → no meals yet   (returns 0 fatigue)
//   0.25 → breakfast done (compare against 25% of daily target)
//   0.50 → lunch done     (compare against 50% of daily target)
//   0.80 → dinner done    (compare against 80% of daily target)
//   1.00 → dessert / end  (compare against full daily target)

export interface FatigueInput {
  calorieIntake: number;
  calorieTarget: number;
  proteinIntake: number;
  proteinTarget: number;
  hydrationConsumed?: number; // glasses consumed today
  hydrationTarget?: number;   // glasses goal (default 8)
  workoutsCompleted?: number; // workouts done today — only counts once completed
  workoutIntensity?: number;  // legacy 0–10 scale (still accepted)
  mealProgress?: number;      // 0–1 fraction of day's meals logged (default 1)
}

export interface FatigueResult {
  fatigue_score: number;
  recovery_recommendation: string;
  breakdown: {
    calorie_factor:   number; // 0–35
    protein_factor:   number; // 0–25
    hydration_factor: number; // 0–20
    workout_factor:   number; // 0–20
  };
}

export function calculateFatigueScore(input: FatigueInput): FatigueResult {
  const {
    calorieIntake,
    calorieTarget,
    proteinIntake,
    proteinTarget,
    hydrationConsumed = 0,
    hydrationTarget   = 8,
    workoutsCompleted = 0,
    workoutIntensity  = 0,
    mealProgress,
  } = input;

  // ─── No meals logged yet → baseline state, score = 0 ─────
  if (mealProgress !== undefined && mealProgress === 0) {
    return {
      fatigue_score: 0,
      recovery_recommendation: 'Log your first meal to start tracking your recovery score.',
      breakdown: { calorie_factor: 0, protein_factor: 0, hydration_factor: 0, workout_factor: 0 },
    };
  }

  // ─── Scale daily targets by meal progress ─────────────────
  // Avoids penalising breakfast-only intake against a full-day target
  const progress = mealProgress !== undefined ? Math.max(0.1, mealProgress) : 1.0;
  const effectiveCalTarget = calorieTarget * progress;
  const effectiveProTarget = proteinTarget * progress;

  // ─── Calorie Factor (0–35 pts) ─────────────────────────
  // Linear: 0% of effective target eaten → 35 pts, 100%+ → 0 pts
  const calRatio = effectiveCalTarget > 0 ? calorieIntake / effectiveCalTarget : 1;
  const calorieFactor = Math.min(35, Math.max(0, Math.round(35 * (1 - Math.min(1, calRatio)))));

  // ─── Protein Factor (0–25 pts) ────────────────────────
  // Linear: 0% of effective protein target → 25 pts, 100%+ → 0 pts
  const proRatio = effectiveProTarget > 0 ? proteinIntake / effectiveProTarget : 1;
  const proteinFactor = Math.min(25, Math.max(0, Math.round(25 * (1 - Math.min(1, proRatio)))));

  // ─── Hydration Factor (0–20 pts) ──────────────────────
  // Linear: no water → 20 pts, fully hydrated → 0 pts
  const hydRatio = hydrationTarget > 0 ? hydrationConsumed / hydrationTarget : 1;
  const hydrationFactor = Math.min(20, Math.max(0, Math.round(20 * (1 - Math.min(1, hydRatio)))));

  // ─── Workout Factor (0–20 pts) ────────────────────────
  // Only applies once a workout is saved as completed.
  // Poor nutrition amplifies the stress (up to 1.5×).
  const workoutStress = workoutsCompleted > 0
    ? Math.min(1, workoutsCompleted / 2)           // 1 workout = 0.5×, 2+ = 1.0×
    : Math.min(10, Math.max(0, workoutIntensity)) / 10;

  const nutritionPenalty = 1 + (1 - Math.min(1, calRatio)) * 0.5; // 1.0–1.5×
  const workoutFactor = Math.min(20, Math.round(workoutStress * 20 * nutritionPenalty));

  // ─── Total score ──────────────────────────────────────
  const fatigue_score = Math.min(100, Math.max(0,
    calorieFactor + proteinFactor + hydrationFactor + workoutFactor
  ));

  // ─── Recovery recommendation ──────────────────────────
  const lowCalories  = calRatio < 0.6;
  const lowProtein   = proRatio < 0.6;
  const lowHydration = hydRatio < 0.5;
  const worked = workoutsCompleted > 0 || workoutIntensity > 3;

  let recovery_recommendation: string;
  if (fatigue_score <= 10) {
    recovery_recommendation = 'You\'re well-fueled and recovered. Keep up the great consistency!';
  } else if (fatigue_score <= 30) {
    if (lowHydration) {
      recovery_recommendation = 'Looking good. Drink a couple more glasses of water to round out the day.';
    } else if (lowProtein) {
      recovery_recommendation = 'On track. Add a protein-rich snack to hit your target.';
    } else {
      recovery_recommendation = 'Mild fatigue — keep eating and you\'ll close the gap easily.';
    }
  } else if (fatigue_score <= 50) {
    if (lowProtein && worked) {
      recovery_recommendation = 'Moderate fatigue. You trained but protein is behind — have a high-protein meal soon.';
    } else if (lowHydration) {
      recovery_recommendation = 'Moderate fatigue. Dehydration is dragging your score. Drink 2–3 glasses now.';
    } else {
      recovery_recommendation = 'Moderate fatigue. Keep logging meals — you\'re making progress.';
    }
  } else if (fatigue_score <= 70) {
    recovery_recommendation = 'High fatigue. You\'re behind on'
      + (lowCalories ? ' calories' : '')
      + (lowCalories && lowProtein ? ' and' : '')
      + (lowProtein ? ' protein' : '')
      + (lowHydration ? ', and dehydrated' : '')
      + '. Eat a full meal with protein + complex carbs'
      + (worked ? ' to support recovery after your workout.' : '.');
  } else {
    recovery_recommendation = 'Critical fatigue. Your body is severely under-recovered. '
      + 'Eat above maintenance, hydrate aggressively, and prioritise 8+ hours of sleep.';
  }

  return {
    fatigue_score,
    recovery_recommendation,
    breakdown: {
      calorie_factor:   calorieFactor,
      protein_factor:   proteinFactor,
      hydration_factor: hydrationFactor,
      workout_factor:   workoutFactor,
    },
  };
}

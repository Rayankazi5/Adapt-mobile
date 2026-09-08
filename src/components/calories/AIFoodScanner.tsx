// Mirrors Adapt/components/calories/AIFoodScanner.tsx
// (getUserMedia/<input type=file> -> expo-camera / expo-image-picker).
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, ChevronDown, ChevronUp, RotateCcw, Sparkles, Upload, X, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getAllFoodNames, getNutritionByLabel } from '../../data/foodNutritionData';
import { cn } from '../../lib/cn';
import {
  classifyImage,
  hasCustomModelAssets,
  savePortionCorrection,
  teachModel,
  type ClassificationResult,
  type ImageSource,
} from '../../ml/foodClassifier';
import { useTheme } from '../../theme/useTheme';
import { FoodEntry } from '../../types';
import { Button } from '../Button';
import { toast } from '../Toast';

interface Props {
  onFoodRecognized: (food: Omit<FoodEntry, 'id'>) => void;
}

type ScannerState = 'idle' | 'camera' | 'preview' | 'analyzing' | 'results';
interface Photo extends ImageSource {
  uri: string;
}

// Normalise any picked/captured image to a downscaled JPEG with base64
// (decodeJpeg only understands JPEG; 640px is plenty for a 224px model).
async function toJpegPhoto(uri: string): Promise<Photo> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 640 });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
  return { uri: saved.uri, base64: saved.base64 ?? '' };
}

export function AIFoodScanner({ onFoodRecognized }: Props) {
  const { colors } = useTheme();
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState(0);
  const [showAllResults, setShowAllResults] = useState(false);
  const [grams, setGrams] = useState(100);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [selectedCorrectionFood, setSelectedCorrectionFood] = useState<string | null>(null);
  const [correctionGrams, setCorrectionGrams] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const top = results[selectedResult];
    if (top?.estimatedGrams) setGrams(top.estimatedGrams);
    else if (top?.nutrition) setGrams(top.nutrition.servingSize);
  }, [selectedResult, results]);

  const pickImage = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (res.canceled || !res.assets[0]) return;
    setPhoto(await toJpegPhoto(res.assets[0].uri));
    setScannerState('preview');
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    const granted = permission?.granted || (await requestPermission()).granted;
    if (!granted) {
      setCameraError('Camera access denied. Please allow camera access or upload an image instead.');
      return;
    }
    setScannerState('camera');
  }, [permission, requestPermission]);

  const capturePhoto = useCallback(async () => {
    const shot = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
    if (!shot) return;
    setPhoto(await toJpegPhoto(shot.uri));
    setScannerState('preview');
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!photo) return;
    setScannerState('analyzing');
    try {
      const predictions = await classifyImage(photo);
      setResults(predictions);
      setSelectedResult(0);
      setScannerState('results');
    } catch (err) {
      console.error('Classification error:', err);
      toast.error('Analysis failed', { description: err instanceof Error ? err.message : undefined });
      setScannerState('preview');
    }
  }, [photo]);

  const resetScanner = useCallback(() => {
    setPhoto(null);
    setResults([]);
    setSelectedResult(0);
    setGrams(100);
    setCameraError(null);
    setIsCorrecting(false);
    setCorrectionQuery('');
    setSelectedCorrectionFood(null);
    setCorrectionGrams('');
    setScannerState('idle');
  }, []);

  const handleConfirm = useCallback(() => {
    const result = results[selectedResult];
    if (!result?.nutrition) {
      toast.error('Missing nutrition info for this food.');
      return;
    }
    const n = result.nutrition;
    const safeGrams = Number.isNaN(grams) ? n.servingSize || 100 : grams;
    const servings = safeGrams / n.servingSize;
    const v = (x?: number) => (x ? x * servings : 0);

    onFoodRecognized({
      name: n.displayName,
      calories: Math.round(n.calories * servings) || 0,
      protein: Math.round(n.protein * servings) || 0,
      carbs: Math.round(n.carbs * servings) || 0,
      fats: Math.round(n.fats * servings) || 0,
      time: new Date().toTimeString().slice(0, 5),
      vitamin_a: v(n.vitamin_a), vitamin_b1: v(n.vitamin_b1), vitamin_b2: v(n.vitamin_b2), vitamin_b3: v(n.vitamin_b3),
      vitamin_b6: v(n.vitamin_b6), vitamin_b9: v(n.vitamin_b9), vitamin_b12: v(n.vitamin_b12), vitamin_c: v(n.vitamin_c),
      vitamin_d: v(n.vitamin_d), vitamin_e: v(n.vitamin_e), vitamin_k: v(n.vitamin_k),
    });

    // Learn portion size from normal usage
    savePortionCorrection(result.label, safeGrams);
    resetScanner();
  }, [results, selectedResult, grams, onFoodRecognized, resetScanner]);

  const handleCorrectionSubmit = async (correctName: string, portionGrams?: number) => {
    if (!photo) return;
    const learningToast = toast.loading(`Teaching AI to recognize ${correctName}...`);
    try {
      await teachModel(correctName, photo);
      if (portionGrams && portionGrams > 0) await savePortionCorrection(correctName.toLowerCase(), portionGrams);

      const realName = getAllFoodNames().find((n) => n.toLowerCase() === correctName.toLowerCase()) || correctName;
      const nutrition = getNutritionByLabel(realName);
      const corrected: ClassificationResult = {
        label: realName.toLowerCase(),
        displayName: realName,
        confidence: 1.0,
        nutrition,
        estimatedMultiplier: results[0]?.estimatedMultiplier || 1,
        estimatedGrams: portionGrams || results[0]?.estimatedGrams,
      };
      setResults([corrected, ...results]);
      setSelectedResult(0);
      setIsCorrecting(false);
      setCorrectionQuery('');
      setSelectedCorrectionFood(null);
      setCorrectionGrams('');
      if (portionGrams) setGrams(portionGrams);

      toast.dismiss(learningToast);
      toast.success(`Success! I've learned that this is ${realName}.`, {
        description: "This correction is now saved to your device's AI brain.",
        duration: 5000,
      });
    } catch (e) {
      toast.dismiss(learningToast);
      console.error('Failed to teach model:', e);
      toast.error('Training Failed', { description: e instanceof Error ? e.message : 'The AI model could not be updated at this time.' });
    }
  };

  // ─── IDLE ───────────────────────────────────────────────
  if (scannerState === 'idle') {
    return (
      <View className="gap-4">
        <View className="flex-row items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
            <Sparkles size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">AI Food Recognition</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              Upload a photo of your Indian food and our AI will identify it and calculate the nutritional content instantly.
            </Text>
            {!hasCustomModelAssets && (
              <Text className="mt-1.5 text-[10px] text-amber-500">
                Custom model not installed — using MobileNet + visual heuristics (see src/ml/modelAssets.ts).
              </Text>
            )}
          </View>
        </View>

        <Pressable onPress={pickImage} className="items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 p-8">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Upload size={28} color={colors.mutedForeground} />
          </View>
          <View className="items-center">
            <Text className="text-sm font-medium text-foreground">Choose a food photo</Text>
            <Text className="mt-1 text-xs text-muted-foreground">from your library • JPG, PNG, WebP</Text>
          </View>
        </Pressable>

        <Button variant="outline" size="lg" className="rounded-xl" onPress={startCamera} icon={<Camera size={16} color={colors.foreground} />}>
          Use Camera
        </Button>
        {cameraError && <Text className="text-center text-xs text-destructive">{cameraError}</Text>}

        <View className="rounded-xl bg-muted p-3">
          <Text className="mb-2 text-xs font-medium text-muted-foreground">Recognizes 101 global & Indian food categories:</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {['Pizza', 'Burger', 'Sushi', 'Biryani', 'Dosa', 'Steak', 'Ramen', 'Pasta', 'Tacos', 'Salad'].map((food) => (
              <View key={food} className="rounded-full bg-violet-500/10 px-2 py-0.5">
                <Text className="text-[10px] font-medium text-violet-700 dark:text-violet-300">{food}</Text>
              </View>
            ))}
            <View className="rounded-full bg-background px-2 py-0.5">
              <Text className="text-[10px] font-medium text-muted-foreground">+91 more</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── CAMERA ─────────────────────────────────────────────
  if (scannerState === 'camera') {
    return (
      <View className="gap-4">
        <View className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View className="absolute inset-8 rounded-2xl border-2 border-white/30" />
            <View className="absolute left-8 top-8 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-white" />
            <View className="absolute right-8 top-8 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-white" />
            <View className="absolute bottom-8 left-8 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-white" />
            <View className="absolute bottom-8 right-8 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-white" />
            <Text className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">Position food in the frame</Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="outline" size="lg" className="rounded-xl" onPress={resetScanner} icon={<X size={16} color={colors.foreground} />}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button size="lg" className="rounded-xl bg-violet-500" textClassName="text-white" onPress={capturePhoto} icon={<Camera size={16} color="white" />}>
              Capture
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // ─── PREVIEW ────────────────────────────────────────────
  if (scannerState === 'preview') {
    return (
      <View className="gap-4">
        <View className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {photo && <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="outline" size="lg" className="rounded-xl" onPress={resetScanner} icon={<RotateCcw size={16} color={colors.foreground} />}>
              Retake
            </Button>
          </View>
          <View className="flex-1">
            <Button size="lg" className="rounded-xl bg-violet-500" textClassName="text-white" onPress={analyzeImage} icon={<Zap size={16} color="white" />}>
              Analyze Food
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // ─── ANALYZING ──────────────────────────────────────────
  if (scannerState === 'analyzing') {
    return (
      <View className="gap-4">
        <View className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {photo && <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
          <View className="items-center justify-center bg-black/50" style={StyleSheet.absoluteFill}>
            <ActivityIndicator size="large" color="white" />
            <Text className="mt-3 text-sm font-medium text-white">Analyzing Food...</Text>
            <Text className="mt-1 text-xs text-white/60">Identifying ingredients & nutrition</Text>
          </View>
        </View>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground">Processing image</Text>
            <Text className="text-xs text-muted-foreground">Please wait</Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-muted">
            <View className="h-full w-[60%] rounded-full bg-violet-500" />
          </View>
        </View>
      </View>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────
  const topResult = results[selectedResult];
  const nutrition = topResult?.nutrition;
  const servings = nutrition ? grams / nutrition.servingSize : 1;
  const correctionMatches = correctionQuery.length > 0
    ? getAllFoodNames().filter((n) => n.toLowerCase().includes(correctionQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <View className="gap-4">
      <View className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
        {photo && <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
          <View className="mb-1 flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-emerald-400" />
            <Text className="text-xs font-medium uppercase tracking-wider text-emerald-400">Identified</Text>
          </View>
          <Text className="text-xl font-bold text-white">{topResult?.displayName}</Text>
          <Text className="mt-0.5 text-xs text-white/60">
            {Math.round((topResult?.confidence ?? 0) * 100)}% confidence
            {nutrition ? ` • ${nutrition.servingSize}${nutrition.servingUnit}` : ''}
          </Text>
        </View>
      </View>

      {nutrition && (
        <View className="gap-4 rounded-xl border border-border bg-muted p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">Calories</Text>
              <Text className="text-2xl font-bold text-orange-500">{Math.round(nutrition.calories * servings)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted-foreground">Portion (g)</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Pressable onPress={() => setGrams(Math.max(10, grams - 10))} className="h-7 w-7 items-center justify-center rounded-lg bg-background">
                  <Text className="text-sm font-bold text-foreground">−</Text>
                </Pressable>
                <Text className="w-12 text-center text-sm font-semibold text-foreground">{grams}g</Text>
                <Pressable onPress={() => setGrams(grams + 10)} className="h-7 w-7 items-center justify-center rounded-lg bg-background">
                  <Text className="text-sm font-bold text-foreground">+</Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View className="gap-2.5">
            <MacroBar label="Protein" value={Math.round(nutrition.protein * servings)} color="bg-blue-500" percentage={((nutrition.protein * 4) / nutrition.calories) * 100} />
            <MacroBar label="Carbs" value={Math.round(nutrition.carbs * servings)} color="bg-amber-500" percentage={((nutrition.carbs * 4) / nutrition.calories) * 100} />
            <MacroBar label="Fats" value={Math.round(nutrition.fats * servings)} color="bg-pink-500" percentage={((nutrition.fats * 9) / nutrition.calories) * 100} />
            <MacroBar label="Fiber" value={Math.round(nutrition.fiber * servings)} color="bg-emerald-500" percentage={Math.min((nutrition.fiber / 10) * 100, 100)} />
          </View>
        </View>
      )}

      {results.length > 1 && (
        <View className="gap-2">
          <Pressable onPress={() => setShowAllResults(!showAllResults)} className="flex-row items-center gap-1">
            {showAllResults ? <ChevronUp size={12} color={colors.mutedForeground} /> : <ChevronDown size={12} color={colors.mutedForeground} />}
            <Text className="text-xs text-muted-foreground">{showAllResults ? 'Hide' : 'Show'} other predictions</Text>
          </Pressable>
          {showAllResults && (
            <View className="gap-1.5">
              {results.map((r, i) => (
                <Pressable
                  key={r.label}
                  onPress={() => setSelectedResult(i)}
                  className={cn(
                    'flex-row items-center justify-between rounded-lg px-3 py-2',
                    i === selectedResult ? 'border border-violet-500/30 bg-violet-500/10' : 'bg-muted'
                  )}
                >
                  <Text className={cn('text-sm font-medium', i === selectedResult ? 'text-violet-700 dark:text-violet-300' : 'text-muted-foreground')}>{r.displayName}</Text>
                  <Text className="text-xs text-muted-foreground">{Math.round(r.confidence * 100)}%</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {isCorrecting ? (
        <View className="gap-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
          {!selectedCorrectionFood ? (
            <>
              <Text className="text-sm font-medium text-foreground">Step 1: What food is this?</Text>
              <TextInput
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                placeholder="Type to search foods..."
                placeholderTextColor={colors.mutedForeground}
                value={correctionQuery}
                onChangeText={setCorrectionQuery}
                autoFocus
              />
              {correctionMatches.length > 0 && (
                <View className="overflow-hidden rounded-lg border border-border bg-card">
                  {correctionMatches.map((name, i) => (
                    <Pressable
                      key={name}
                      onPress={() => { setSelectedCorrectionFood(name); setCorrectionQuery(name); }}
                      className={cn('px-3 py-2', i < correctionMatches.length - 1 && 'border-b border-border')}
                    >
                      <Text className="text-sm text-foreground">{name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">
                  Food: <Text className="text-violet-500">{selectedCorrectionFood}</Text>
                </Text>
                <Pressable onPress={() => { setSelectedCorrectionFood(null); setCorrectionQuery(''); }}>
                  <Text className="text-xs text-muted-foreground">Change</Text>
                </Pressable>
              </View>
              <View>
                <Text className="text-xs text-muted-foreground">Step 2: Correct portion size (grams)</Text>
                <View className="mt-1 flex-row items-center gap-2">
                  <TextInput
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                    placeholder="e.g. 400"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    value={correctionGrams}
                    onChangeText={setCorrectionGrams}
                    autoFocus
                  />
                  <Text className="text-sm text-muted-foreground">g</Text>
                </View>
              </View>
              <Button
                className="rounded-lg bg-violet-500"
                textClassName="text-white"
                onPress={() => handleCorrectionSubmit(selectedCorrectionFood, correctionGrams ? parseInt(correctionGrams, 10) : undefined)}
                icon={<Sparkles size={16} color="white" />}
              >
                Teach AI
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onPress={() => { setIsCorrecting(false); setSelectedCorrectionFood(null); setCorrectionQuery(''); setCorrectionGrams(''); }}>
            Cancel
          </Button>
        </View>
      ) : (
        <Pressable onPress={() => setIsCorrecting(true)} className="py-1">
          <Text className="text-center text-xs text-muted-foreground">Wrong prediction? Teach the AI.</Text>
        </Pressable>
      )}

      <View className="mt-2 flex-row gap-3">
        <View className="flex-1">
          <Button variant="outline" size="lg" className="rounded-xl" onPress={resetScanner} icon={<RotateCcw size={16} color={colors.foreground} />}>
            Scan Again
          </Button>
        </View>
        <View className="flex-1">
          <Button size="lg" className="rounded-xl bg-emerald-500" textClassName="text-white" onPress={handleConfirm} disabled={!nutrition} icon={<Check size={16} color="white" />}>
            Add Food
          </Button>
        </View>
      </View>
    </View>
  );
}

function MacroBar({ label, value, color, percentage }: { label: string; value: number; color: string; percentage: number }) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground">{value}g</Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-background">
        <View className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(Number.isFinite(percentage) ? percentage : 0, 100)}%` }} />
      </View>
    </View>
  );
}

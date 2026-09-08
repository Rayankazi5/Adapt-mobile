// Mirrors Adapt/components/calories/BarcodeScanner.tsx
// (BarcodeDetector -> expo-camera; /api/barcode -> Open Food Facts API).
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Loader2, Scan, Search } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { lookupBarcode } from '../../services/openFoodFacts';
import { useTheme } from '../../theme/useTheme';
import { FoodEntry } from '../../types';
import { Button } from '../Button';
import { toast } from '../Toast';

interface Props {
  onFoodRecognized: (food: Omit<FoodEntry, 'id'>) => void;
}

export function BarcodeScanner({ onFoodRecognized }: Props) {
  const { colors } = useTheme();
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);

  const startCamera = async () => {
    const granted = permission?.granted || (await requestPermission()).granted;
    if (!granted) {
      toast.error('Could not access camera. Please enter barcode manually.');
      return;
    }
    handledRef.current = false;
    setCameraActive(true);
  };

  const stopCamera = () => setCameraActive(false);

  const handleBarcodeSubmit = async (codeToSubmit = barcode) => {
    if (!codeToSubmit) {
      toast.error('Please enter a barcode number');
      return;
    }
    setIsScanning(true);
    try {
      const result = await lookupBarcode(codeToSubmit);
      if (result.success) {
        const d = result.data;
        onFoodRecognized({
          name: d.brands ? `${d.brands} - ${d.name}` : d.name,
          calories: Math.round(d.calories || 0),
          protein: Math.round(d.protein || 0),
          carbs: Math.round(d.carbs || 0),
          fats: Math.round(d.fat || 0),
          time: new Date().toTimeString().slice(0, 5),
          vitamin_a: d.vitamin_a || 0,
          vitamin_b1: d.vitamin_b1 || 0,
          vitamin_b2: d.vitamin_b2 || 0,
          vitamin_b3: d.vitamin_b3 || 0,
          vitamin_b6: d.vitamin_b6 || 0,
          vitamin_b9: d.vitamin_b9 || 0,
          vitamin_b12: d.vitamin_b12 || 0,
          vitamin_c: d.vitamin_c || 0,
          vitamin_d: d.vitamin_d || 0,
          vitamin_e: d.vitamin_e || 0,
          vitamin_k: d.vitamin_k || 0,
        });
        toast.success('Product found from Open Food Facts DB!');
        setBarcode('');
      } else {
        toast.error(result.error || 'Product not found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching barcode from database');
    } finally {
      setIsScanning(false);
    }
  };

  if (cameraActive) {
    return (
      <View className="gap-4">
        <View className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }) => {
              if (handledRef.current) return;
              handledRef.current = true;
              setBarcode(data);
              stopCamera();
              toast.success(`Scanned: ${data}`);
              handleBarcodeSubmit(data);
            }}
          />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View className="absolute inset-x-8 inset-y-1/3 rounded-xl border-2 border-red-500/50" />
            <View className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500/80" />
          </View>
        </View>
        <Button variant="outline" size="lg" onPress={stopCamera}>
          Cancel Scan
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-5">
      <View className="flex-row items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
          <Scan size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">Barcode Database</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Powered by Open Food Facts. Scan or enter a product barcode to log its calories and macros.
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Enter Barcode Manually</Text>
        <View className="flex-row gap-2">
          <TextInput
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            placeholder="e.g. 0000101209159"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={barcode}
            onChangeText={(t) => setBarcode(t.replace(/[^0-9]/g, ''))}
            editable={!isScanning}
          />
          <Pressable
            onPress={() => handleBarcodeSubmit(barcode)}
            disabled={isScanning || !barcode}
            className={`h-9 w-11 items-center justify-center rounded-md bg-blue-600 ${isScanning || !barcode ? 'opacity-50' : ''}`}
          >
            {isScanning ? <ActivityIndicator color="white" size="small" /> : <Search size={16} color="white" />}
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-xs text-muted-foreground">OR</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Scan with Camera</Text>
        <Pressable onPress={startCamera} className="items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 p-8">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Scan size={32} color={colors.mutedForeground} />
          </View>
          <View className="items-center">
            <Text className="text-sm font-medium text-foreground">Tap to scan a barcode</Text>
            <Text className="mt-1 text-xs text-muted-foreground">Requires camera permission</Text>
          </View>
        </Pressable>
      </View>
      {isScanning && (
        <View className="flex-row items-center justify-center gap-2">
          <Loader2 size={14} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground">Looking up product…</Text>
        </View>
      )}
    </View>
  );
}

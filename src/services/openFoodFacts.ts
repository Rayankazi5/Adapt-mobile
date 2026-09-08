// Replaces the web app's `/api/barcode/:code` (served from the 400MB
// food_facts.sqlite, itself built from Open Food Facts) with the OFF public
// API. Returns the same row shape as the sqlite `food_products` table.
export interface BarcodeProduct {
  name: string;
  brands: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  vitamin_a: number; // mcg
  vitamin_b1: number; // mg
  vitamin_b2: number; // mg
  vitamin_b3: number; // mg
  vitamin_b6: number; // mg
  vitamin_b9: number; // mcg
  vitamin_b12: number; // mcg
  vitamin_c: number; // mg
  vitamin_d: number; // mcg
  vitamin_e: number; // mg
  vitamin_k: number; // mcg
}

export type BarcodeLookup = { success: true; data: BarcodeProduct } | { success: false; error: string };

const FIELDS = 'product_name,brands,nutriments';

// OFF `_100g` nutriment values are in grams (energy in kcal/kJ).
const g = (n: Record<string, unknown>, key: string) => Number(n[`${key}_100g`]) || 0;
const toMg = (v: number) => v * 1000;
const toMcg = (v: number) => v * 1_000_000;

export async function lookupBarcode(code: string): Promise<BarcodeLookup> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, {
    headers: { 'User-Agent': 'AdaptMobile/1.0 (fitness tracker)' },
  });
  if (!res.ok) return { success: false, error: `Open Food Facts error (${res.status})` };

  const json = await res.json();
  if (json.status !== 1 || !json.product) return { success: false, error: 'Product not found in Open Food Facts' };

  const p = json.product;
  const n: Record<string, unknown> = p.nutriments ?? {};
  const kcal = g(n, 'energy-kcal') || g(n, 'energy') / 4.184;

  return {
    success: true,
    data: {
      name: p.product_name || 'Unknown product',
      brands: p.brands || null,
      calories: kcal,
      protein: g(n, 'proteins'),
      fat: g(n, 'fat'),
      carbs: g(n, 'carbohydrates'),
      vitamin_a: toMcg(g(n, 'vitamin-a')),
      vitamin_b1: toMg(g(n, 'vitamin-b1')),
      vitamin_b2: toMg(g(n, 'vitamin-b2')),
      vitamin_b3: toMg(g(n, 'vitamin-pp')),
      vitamin_b6: toMg(g(n, 'vitamin-b6')),
      vitamin_b9: toMcg(g(n, 'vitamin-b9')),
      vitamin_b12: toMcg(g(n, 'vitamin-b12')),
      vitamin_c: toMg(g(n, 'vitamin-c')),
      vitamin_d: toMcg(g(n, 'vitamin-d')),
      vitamin_e: toMg(g(n, 'vitamin-e')),
      vitamin_k: toMcg(g(n, 'vitamin-k')),
    },
  };
}

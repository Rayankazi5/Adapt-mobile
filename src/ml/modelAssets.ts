// The web app's custom food classifier lives in Adapt/public/models/
// food-classifier/ (gitignored, not present in this checkout). To enable it
// here, copy `model.json` + its `group1-shard*of*.bin` files into
// assets/models/food-classifier/ and replace `null` below with:
//
//   export const customModelAssets: CustomModelAssets = {
//     modelJson: require('../../assets/models/food-classifier/model.json'),
//     weights: [require('../../assets/models/food-classifier/group1-shard1of1.bin')],
//   };
//
// (metro.config.js already treats .bin as an asset.) Until then the
// classifier falls back to MobileNet + visual heuristics, exactly like the
// web app does when its static model is missing.
export interface CustomModelAssets {
  modelJson: unknown;
  weights: number[];
}

export const customModelAssets: CustomModelAssets | null = null;

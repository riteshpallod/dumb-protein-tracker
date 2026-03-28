import * as SQLite from 'expo-sqlite';

/** Seed food items. */
const FOOD_ITEMS = [
  { name: 'Chicken Breast', serving_label: '1 breast (172g)', weight_grams: 172, protein_grams: 53, calories: 284, category: 'High Protein' },
  { name: 'Greek Yogurt', serving_label: '1 cup (245g)', weight_grams: 245, protein_grams: 20, calories: 130, category: 'Snacks' },
  { name: 'Oatmeal', serving_label: '1 cup cooked (234g)', weight_grams: 234, protein_grams: 6, calories: 154, category: 'Snacks' },
  { name: 'Almonds', serving_label: '1 oz (28g)', weight_grams: 28, protein_grams: 6, calories: 164, category: 'Snacks' },
  { name: 'Avocado Toast', serving_label: '1 slice (160g)', weight_grams: 160, protein_grams: 7, calories: 290, category: 'Cheat Meal' },
  { name: 'Scrambled Eggs', serving_label: '2 eggs (122g)', weight_grams: 122, protein_grams: 13, calories: 182, category: 'High Protein' },
  { name: 'Protein Shake', serving_label: '1 scoop (350ml)', weight_grams: 350, protein_grams: 30, calories: 160, category: 'Drinks' },
  { name: 'Salmon Fillet', serving_label: '1 fillet (178g)', weight_grams: 178, protein_grams: 40, calories: 367, category: 'High Protein' },
  { name: 'Brown Rice', serving_label: '1 cup cooked (195g)', weight_grams: 195, protein_grams: 5, calories: 216, category: 'Cheat Meal' },
  { name: 'Broccoli', serving_label: '1 cup (156g)', weight_grams: 156, protein_grams: 4, calories: 55, category: 'Snacks' },
];

/**
 * Seeds the database with demo data for visual testing.
 * Inserts a user profile, 10 food items, and 14 days of food log entries.
 */
export async function seedDemoData(db: SQLite.SQLiteDatabase): Promise<void> {
  // Update user profile
  await db.runAsync(
    `UPDATE user_settings SET name = ?, height_cm = ?, weight_kg = ?, goal_type = ?, calorie_goal = ?, protein_goal = ?, onboarding_complete = 1 WHERE id = 1`,
    ['Alex Rivera', 178, 76, 'maintain', 2150, 165]
  );

  // Clear existing data
  await db.runAsync('DELETE FROM food_log');
  await db.runAsync('DELETE FROM food_items');
  await db.runAsync('DELETE FROM weight_log');

  // Insert food items
  const itemIds: number[] = [];
  for (const item of FOOD_ITEMS) {
    const result = await db.runAsync(
      'INSERT INTO food_items (name, serving_label, weight_grams, protein_grams, calories, category) VALUES (?, ?, ?, ?, ?, ?)',
      [item.name, item.serving_label, item.weight_grams, item.protein_grams, item.calories, item.category]
    );
    itemIds.push(result.lastInsertRowId);
  }

  // Generate 14 days of log entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    // 3-5 entries per day with varied servings
    const entryCount = 3 + Math.floor(seededRandom(dayOffset * 7) * 3);
    const usedIndices = new Set<number>();

    for (let e = 0; e < entryCount; e++) {
      // Pick a unique food item for this day
      let idx = Math.floor(seededRandom(dayOffset * 13 + e * 3) * FOOD_ITEMS.length);
      while (usedIndices.has(idx) && usedIndices.size < FOOD_ITEMS.length) {
        idx = (idx + 1) % FOOD_ITEMS.length;
      }
      usedIndices.add(idx);

      const item = FOOD_ITEMS[idx];
      const servings = SERVING_PATTERN[(dayOffset + e) % SERVING_PATTERN.length];
      const calTotal = Math.round(item.calories * servings);
      const protTotal = +(item.protein_grams * servings).toFixed(1);

      await db.runAsync(
        'INSERT INTO food_log (food_item_id, log_date, servings, calories_total, protein_total) VALUES (?, ?, ?, ?, ?)',
        [itemIds[idx], dateStr, servings, calTotal, protTotal]
      );
    }
  }
  // Generate 14 days of weight entries (starting around 76kg with small variations)
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const weight = 76 + (seededRandom(dayOffset * 17 + 5) - 0.5) * 2; // 75–77 range
    await db.runAsync(
      'INSERT INTO weight_log (log_date, weight_kg) VALUES (?, ?)',
      [dateStr, +weight.toFixed(1)]
    );
  }
}

/** Varied serving sizes for realistic data. */
const SERVING_PATTERN = [1.0, 0.5, 1.5, 1.0, 2.0, 1.0, 0.5, 1.0, 1.5, 1.0, 0.5, 2.0, 1.0, 1.5];

/** Deterministic pseudo-random for reproducible seed data. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

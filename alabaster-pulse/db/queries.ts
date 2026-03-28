import * as SQLite from 'expo-sqlite';

export type UserSettings = {
  id: number;
  name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_type: 'shred' | 'maintain' | 'bulk';
  calorie_goal: number;
  protein_goal: number;
  onboarding_complete: number;
  avatar_uri: string | null;
};

export type FoodItem = {
  id: number;
  name: string;
  serving_label: string;
  weight_grams: number;
  protein_grams: number;
  calories: number;
  category: string;
  created_at: string;
};

export type FoodLogEntry = {
  id: number;
  food_item_id: number;
  log_date: string;
  servings: number;
  calories_total: number;
  protein_total: number;
  logged_at: string;
  // joined from food_items
  name?: string;
  serving_label?: string;
  category?: string;
};

export type DailySummary = {
  log_date: string;
  total_calories: number;
  total_protein: number;
};

export type WeightEntry = {
  id: number;
  log_date: string;
  weight_kg: number;
  logged_at: string;
};

/** Fetch user settings row. */
export async function getSettings(db: SQLite.SQLiteDatabase): Promise<UserSettings> {
  const row = await db.getFirstAsync<UserSettings>('SELECT * FROM user_settings WHERE id = 1');
  if (!row) throw new Error('Settings row missing');
  return row;
}

/** Update one or more settings fields. */
export async function updateSettings(
  db: SQLite.SQLiteDatabase,
  fields: Partial<Omit<UserSettings, 'id'>>
): Promise<void> {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values: SQLite.SQLiteBindValue[] = keys.map((k) => {
    const v = fields[k];
    return v === undefined ? null : (v as SQLite.SQLiteBindValue);
  });
  await db.runAsync(`UPDATE user_settings SET ${setClause} WHERE id = 1`, values);
}

/** Get all food items, optionally filtered by search query. */
export async function getFoodItems(
  db: SQLite.SQLiteDatabase,
  search?: string
): Promise<FoodItem[]> {
  if (search && search.trim()) {
    return db.getAllAsync<FoodItem>(
      "SELECT * FROM food_items WHERE name LIKE ? ORDER BY name ASC",
      [`%${search.trim()}%`]
    );
  }
  return db.getAllAsync<FoodItem>('SELECT * FROM food_items ORDER BY name ASC');
}

/** Insert a new food item. Returns its new id. */
export async function insertFoodItem(
  db: SQLite.SQLiteDatabase,
  item: Omit<FoodItem, 'id' | 'created_at'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO food_items (name, serving_label, weight_grams, protein_grams, calories, category) VALUES (?, ?, ?, ?, ?, ?)',
    [item.name, item.serving_label, item.weight_grams, item.protein_grams, item.calories, item.category]
  );
  return result.lastInsertRowId;
}

/** Update a food item by id. */
export async function updateFoodItem(
  db: SQLite.SQLiteDatabase,
  id: number,
  fields: Partial<Omit<FoodItem, 'id' | 'created_at'>>
): Promise<void> {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values: SQLite.SQLiteBindValue[] = keys.map((k) => {
    const v = fields[k];
    return v === undefined ? null : (v as SQLite.SQLiteBindValue);
  });
  await db.runAsync(`UPDATE food_items SET ${setClause} WHERE id = ?`, [...values, id]);
}

/** Delete a food item (cascades log entries). */
export async function deleteFoodItem(db: SQLite.SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM food_items WHERE id = ?', [id]);
}

/** Get one food item by id. */
export async function getFoodItemById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<FoodItem | null> {
  return db.getFirstAsync<FoodItem>('SELECT * FROM food_items WHERE id = ?', [id]);
}

/** Get food log entries for a specific date, joined with food item name. */
export async function getLogForDate(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<FoodLogEntry[]> {
  return db.getAllAsync<FoodLogEntry>(
    `SELECT fl.*, fi.name, fi.serving_label, fi.category
     FROM food_log fl
     JOIN food_items fi ON fi.id = fl.food_item_id
     WHERE fl.log_date = ?
     ORDER BY fl.logged_at DESC`,
    [date]
  );
}

/** Insert a food log entry. */
export async function insertLogEntry(
  db: SQLite.SQLiteDatabase,
  entry: { food_item_id: number; log_date: string; servings: number; calories_total: number; protein_total: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO food_log (food_item_id, log_date, servings, calories_total, protein_total) VALUES (?, ?, ?, ?, ?)',
    [entry.food_item_id, entry.log_date, entry.servings, entry.calories_total, entry.protein_total]
  );
}

/** Delete a log entry by id. */
export async function deleteLogEntry(db: SQLite.SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM food_log WHERE id = ?', [id]);
}

/** Get daily summaries for the last N days (for insights). */
export async function getDailySummaries(
  db: SQLite.SQLiteDatabase,
  limit: number
): Promise<DailySummary[]> {
  return db.getAllAsync<DailySummary>(
    `SELECT log_date,
            SUM(calories_total) as total_calories,
            SUM(protein_total) as total_protein
     FROM food_log
     GROUP BY log_date
     ORDER BY log_date DESC
     LIMIT ?`,
    [limit]
  );
}

/** Get all daily summaries. */
export async function getAllDailySummaries(db: SQLite.SQLiteDatabase): Promise<DailySummary[]> {
  return db.getAllAsync<DailySummary>(
    `SELECT log_date,
            SUM(calories_total) as total_calories,
            SUM(protein_total) as total_protein
     FROM food_log
     GROUP BY log_date
     ORDER BY log_date DESC`
  );
}

/** Insert a weight log entry. */
export async function insertWeightEntry(
  db: SQLite.SQLiteDatabase,
  entry: { log_date: string; weight_kg: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO weight_log (log_date, weight_kg) VALUES (?, ?)',
    [entry.log_date, entry.weight_kg]
  );
}

/** Get weight entries for the last N days. */
export async function getWeightEntries(
  db: SQLite.SQLiteDatabase,
  limit: number
): Promise<WeightEntry[]> {
  return db.getAllAsync<WeightEntry>(
    `SELECT * FROM weight_log ORDER BY log_date DESC LIMIT ?`,
    [limit]
  );
}

/** Get all weight entries. */
export async function getAllWeightEntries(db: SQLite.SQLiteDatabase): Promise<WeightEntry[]> {
  return db.getAllAsync<WeightEntry>(
    `SELECT * FROM weight_log ORDER BY log_date DESC`
  );
}

/** Get today's weight entry if it exists. */
export async function getWeightForDate(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<WeightEntry | null> {
  return db.getFirstAsync<WeightEntry>(
    'SELECT * FROM weight_log WHERE log_date = ? ORDER BY logged_at DESC LIMIT 1',
    [date]
  );
}

/** Compute current streak (consecutive days with log entries, ending today or yesterday). */
export async function getStreak(db: SQLite.SQLiteDatabase): Promise<number> {
  const summaries = await getAllDailySummaries(db);
  if (summaries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = new Set(summaries.map((s) => s.log_date));
  let streak = 0;
  const cursor = new Date(today);

  // Allow streak to start from today or yesterday
  const todayStr = cursor.toISOString().split('T')[0];
  const yestStr = new Date(cursor.getTime() - 86400000).toISOString().split('T')[0];
  if (!dates.has(todayStr) && !dates.has(yestStr)) return 0;
  if (!dates.has(todayStr)) cursor.setDate(cursor.getDate() - 1);

  while (dates.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

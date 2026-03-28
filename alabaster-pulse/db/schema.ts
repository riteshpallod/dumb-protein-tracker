export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    height_cm REAL,
    weight_kg REAL,
    goal_type TEXT CHECK(goal_type IN ('shred','maintain','bulk')) DEFAULT 'maintain',
    calorie_goal INTEGER DEFAULT 2150,
    protein_goal INTEGER DEFAULT 165,
    onboarding_complete INTEGER DEFAULT 0,
    avatar_uri TEXT,
    age INTEGER,
    sex TEXT CHECK(sex IN ('male','female'))
  );

  CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    serving_label TEXT NOT NULL,
    weight_grams REAL NOT NULL,
    protein_grams REAL NOT NULL,
    calories INTEGER NOT NULL,
    category TEXT DEFAULT 'Other',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS food_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_item_id INTEGER NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    servings REAL DEFAULT 1.0,
    calories_total INTEGER NOT NULL,
    protein_total REAL NOT NULL,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weight_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_date TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    logged_at TEXT DEFAULT (datetime('now'))
  );
`;

export const SEED_SETTINGS = `
  INSERT OR IGNORE INTO user_settings (id, calorie_goal, protein_goal, onboarding_complete)
  VALUES (1, 2150, 165, 0);
`;

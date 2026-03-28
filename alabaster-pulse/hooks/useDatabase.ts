import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SEED_SETTINGS } from '../db/schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/** Opens (or returns) the singleton SQLite database and runs migrations. */
export function useDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(dbInstance);
  const [ready, setReady] = useState(!!dbInstance);

  useEffect(() => {
    if (dbInstance) return;

    async function init() {
      const database = await SQLite.openDatabaseAsync('alabaster-pulse.db');
      await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      await database.execAsync(CREATE_TABLES);
      await database.execAsync(SEED_SETTINGS);
      // Migrations
      await database.execAsync(`ALTER TABLE user_settings ADD COLUMN avatar_uri TEXT`).catch(() => {});
      await database.execAsync(`ALTER TABLE food_items ADD COLUMN fat_grams REAL DEFAULT 0`).catch(() => {});
      dbInstance = database;
      setDb(database);
      setReady(true);
    }

    init().catch(console.error);
  }, []);

  return { db, ready };
}

/** Returns the cached DB instance (throws if not yet initialized). */
export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) throw new Error('Database not initialized yet');
  return dbInstance;
}

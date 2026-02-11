// This is just for testing purposes, NOT for production use

import { SQLiteDatabase } from 'expo-sqlite';

export class DatabaseSetup {
  
  static async initialize(db: SQLiteDatabase) {
    console.log("Creating tables...");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_number INTEGER,
        start_page INTEGER,
        end_page INTEGER,
        is_completed INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ayahs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surah_id INTEGER,
        surah_name_ar TEXT,
        surah_name_en TEXT,
        type TEXT,
        number_in_surah INTEGER,
        text TEXT,
        page INTEGER
      );
    `);

    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM ayahs');
    if (result && result.count === 0) {
      console.log("Seeding Dummy Data (Al-Fatiha)...");
      await db.execAsync(`
        INSERT INTO ayahs (surah_id, surah_name_ar, surah_name_en, type, number_in_surah, text, page) VALUES
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 1, 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 1),
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 2, 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 1),
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 3, 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 1),
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 4, 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', 1),
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 1),
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 6, 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', 1),
        (1, 'الفاتحة', 'Al-Fatiha', 'Meccan', 7, 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', 1);
      `);
    }
    console.log("Database initialized!");
  }
}
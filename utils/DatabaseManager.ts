import * as SQLite from "expo-sqlite";
import * as FileSystem from 'expo-file-system/legacy'; // FORCE LEGACY
import { Asset } from 'expo-asset';
import * as rp from "@/types/reader_data"
import * as qd from "@/types/quran_data"

export interface UserSettings {
    id: number;
    font?: string;
    font_size: number;
    reading_mode: number;
    partition_type: string;
    starting_date: string;
    ending_date: string;
    werd_plan_days: number,
    theme: number;
	language: string;
	currentWerd: number;
    setup_completed: number;
}

export interface UserProgress {
	first_verse: number;
	last_verse: number;
	date: string;
}

export interface Bookmark {
	id: number;
	verse: number;
}

export interface Surah {
	id: number;
	first_verse: number;
	last_verse: number;
	starting_page_id: number;
	ayahs: number,
	arabicName: string;
	englishName: string;
	type: string;
}

export interface StreakData {
    count: number;
    longest: number;
    date: string | null;
}

export interface DateData {
    day: number;
    month: number;
    year: number;
    is_done: number;
}

export interface DailyProgress {
    day_number: number;
    date: string;
    start_verse: number;
    end_verse: number;
    total_verses: number;
    total_pages: number;
    start_unit_val: number;
    end_unit_val: number;
    is_completed: number;
    max_verses: number;
    max_pages: number;
}

export const isEmpty = async (db: SQLite.SQLiteDatabase, table: string) => {
	const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table}`
    );
    return result!.count === 0;
}

const DB_NAME = "werd_db.db";
let database: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;
// @ts-ignore
export async function getDB() {
    if (database) return database;
    if (dbInitPromise) return dbInitPromise;
    
    // @ts-ignore
    dbInitPromise = (async () => {
        try {
            const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
            const dbDir = `${FileSystem.documentDirectory}SQLite/`;

            const fileInfo = await FileSystem.getInfoAsync(dbPath);
            
            if (!fileInfo.exists || fileInfo.size === 0) {
                console.log("Database missing or empty. Copying from assets...");
                const dirInfo = await FileSystem.getInfoAsync(dbDir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
                }

                const asset = Asset.fromModule(require('@/assets/database/werd_db.db'));
                await asset.downloadAsync();

                if (asset.localUri) {
                    await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
                    console.log("Database copied successfully!");
                }
            }

            const db = await SQLite.openDatabaseAsync(DB_NAME);

            const tableCheck = await db.getFirstAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='surahs'"
            );

            if (!tableCheck) {
                console.error("Opened database is EMPTY. Deleting and forcing re-copy...");
                database = null;
                await db.closeAsync();
                await FileSystem.deleteAsync(dbPath, { idempotent: true });
                return getDB();
            }

            database = db;
            return db;
        } catch (error) {
            console.error("Failed to open DB:", error);
            dbInitPromise = null;
            throw error;
        }
    })();

    return dbInitPromise;
}

export async function ensureDailyProgressTable() {
    try {
        const db = await getDB();
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS daily_progress (
                day_number INTEGER PRIMARY KEY,
                date TEXT,
                start_verse INTEGER,
                end_verse INTEGER,
                start_unit_val INTEGER,
                end_unit_val INTEGER,
                is_completed INTEGER DEFAULT 0
            );
        `);
        console.log("Checked daily_progress table.");
    } catch (e) {
        console.error("Error creating daily_progress table:", e);
    }
}

export async function initDB(clear: number = 0) {
    try {
        let db = await getDB();
        
        if (clear) {
            console.log("clearing database");
            await db.closeAsync();
            
            const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
            
            database = null;
            dbInitPromise = null;
            
            db = await getDB(); 
        }

        try {
            await db.runAsync('ALTER TABLE user_settings ADD COLUMN setup_completed INTEGER DEFAULT 0');
            console.log("Added setup_completed column");
        } catch (e) {
            console.log("setup_completed column already exists, skipping...");
        }

        if (await isEmpty(db, "streaks")) {
            await db.runAsync(`INSERT INTO streaks VALUES (?, ?, ?, ?)`, [1, 0, 0, '9/9/2009'])
        }

        if (await isEmpty(db, "user_settings")) {
            await db.runAsync(`
                INSERT INTO user_settings (id, font, font_size, reading_mode, partition_type, starting_date, ending_date, theme, language, currentWerd, werd_plan_days, setup_completed) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [1, "D1", 14, 0, "page", "6/6/2006", "7/7/2007", 1, "en", 1, 30, 0]);
        }

        if (await isEmpty(db, "werd_segments")) {
            await db.runAsync(`INSERT INTO werd_segments (id, first_verse, last_verse, date, done) 
                VALUES (?, ?, ?, ?, ?)`, [1, 1, 20, '11/11/2011', 0])
        }

        const settings = await getSettings(); 
        console.log("SETTINGS GOT WHEN CREATING THE FIRST ROW =", settings);
        console.log("Database initialized successfully");
    }
    catch (error) {
        console.error("Initialization Failed:", error);
    }
}

export const fetchQuranText = async (params: rp.ReaderParams): Promise<qd.ReadingSession> => {
    try {
        const db = await getDB();
        let verses: any[] = [];

        if (params.sessionType === "daily_werd") {
            const settings = await getSettings() as UserSettings;
            
            if (!settings) {
                console.log("No settings found");
                return { sessionId: "-1", sessionType: params.sessionType, segments: [] };
            }

            const currentWerdId = settings.currentWerd;
            const segment = await getDailyProgress(currentWerdId) as DailyProgress;

            if (segment) {
                verses = await fetchVerses(segment.start_verse, segment.end_verse, 'verse');
            } else {
                console.log("No segment found for today");
                return { sessionId: "-1", sessionType: params.sessionType, segments: [] };
            }
        }
		else if(params.sessionType === "full_surah") {
			// @ts-ignore
            verses = await fetchVerses(params.surahId, params.surahId, 'surah');
        }

        const segments: qd.SurahSegment[] = [];
        
        if (verses.length > 0) {
            let curSurah = verses[0].surah_id
            let ayahs: qd.AyahData[] = []
            for (let i = 0; i < verses.length; i++) {
            
                if (verses[i].surah_id === curSurah) {
                    ayahs.push({
                        number: verses[i].relative_id,
                        text: verses[i].text
                    });
                }
                else {
                    segments.push({
                            surahId: curSurah,
                            surahNameEnglish: "-1",
                            surahNameArabic: "-1",
                            surahType: 'Meccan',
                            ayahs: ayahs
                        }
                    );
                    ayahs = [{
                        number: verses[i].relative_id,
                        text: verses[i].text
                    }]
                    curSurah = verses[i].surah_id 
                }
            }

            if (ayahs.length > 0) {
                segments.push({
                    surahId: curSurah,
                    surahNameEnglish: "-1",
                    surahNameArabic: "-1",
                    surahType: 'Meccan',
                    ayahs: ayahs
                });
            }
        }

        return {
            sessionId: "-1",
            sessionType: params.sessionType,
            segments: segments
        };

    } catch (error) {
        console.error("Error fetching Quran Text:", error);
		return {
            sessionId: "-1",
            sessionType: params.sessionType,
            segments: []
        };
    }
}

export type PartitionType = 'verse' | 'surah' | 'juz' | 'page';

export const fetchVerses = async (l: number, r: number, partitionType: PartitionType) => {
    const db = await getDB();
    let first_verse = l, last_verse = r; // verses by default

    try {
        if (partitionType === 'surah') { // surahs
            // @ts-ignore
            const resL = await db.getFirstAsync<{first_verse: number}>(`SELECT first_verse FROM surahs WHERE id = ?`, [l]);
            // @ts-ignore
            const resR = await db.getFirstAsync<{last_verse: number}>(`SELECT last_verse FROM surahs WHERE id = ?`, [r]);
            if (resL) first_verse = resL.first_verse;
            if (resR) last_verse = resR.last_verse;
        }
        else if (partitionType === 'juz') { // juz
            // @ts-ignore
            const resL = await db.getFirstAsync<{first_verse: number}>(`SELECT first_verse FROM juz WHERE id = ?`, [l]);
            // @ts-ignore
            const resR = await db.getFirstAsync<{last_verse: number}>(`SELECT last_verse FROM juz WHERE id = ?`, [r]);
            if (resL) first_verse = resL.first_verse;
            if (resR) last_verse = resR.last_verse;
        }
        else if (partitionType === 'page') { // pages
            // @ts-ignore
            const resL = await db.getFirstAsync<{first_verse: number}>(`SELECT first_verse FROM pages WHERE id = ?`, [l]);
            // @ts-ignore
            const resR = await db.getFirstAsync<{last_verse: number}>(`SELECT last_verse FROM pages WHERE id = ?`, [r]);
            if (resL) first_verse = resL.first_verse;
            if (resR) last_verse = resR.last_verse;
        }

        const data = await db.getAllAsync(`SELECT * FROM verses WHERE id >= ? AND id <= ?`, [first_verse, last_verse]);
        return data;

    } catch (error) {
        console.error("Fetch Verses Error:", error);
        return [];
    }
}

export const getSurahs = async () => {
    try {
        const db = await getDB()
        const data = await db.getAllAsync(`SELECT * FROM surahs`) as Surah[]
        if (data) return data
    }
    catch (error) {
        console.log(error)
        return []
    }
}

export const SetFont = async (font: string) => {
	try {
		const db = await getDB()
		await db.runAsync(`UPDATE user_settings SET font = ?`, [font])
		console.log("font updated")
	}
	catch (error) {
		console.log(error)
	}
}

export const updateSettings = async(updates: Partial<UserSettings>, id: number = 1) => {
	try {
		const db = await getDB()
		const fields = Object.keys(updates)
		if (!fields.length) return
		const values = Object.values(updates)
		values.push(id)
		const query = fields.map(field => `${field} = ?`).join(", ")
		console.log("Settings Modified")
		await db.runAsync(`UPDATE user_settings SET ${query} WHERE id = ?`, values)
	}
	catch(error) {
		console.log(error)
	}
}

export const getSettings = async (id: number = 1) => {
    try {
        const db = await getDB();
        const data = await db.getFirstAsync(`SELECT * FROM user_settings WHERE id = ?`, [id]) as UserSettings;
        return data || null;
    } catch (error) {
        console.error("getSettings error:", error);
        return null;
    }
}

export const getUserProgress = async () => {
    // THIS IS STILL IN TESTING, NOT FINALIZED
	try {
		const db = await getDB()
        await ensureDailyProgressTable();
		const data = await db.getAllAsync(`SELECT * FROM daily_progress WHERE is_completed = 1`) 
		return data
	}
	catch (error) {
		console.log(error)
		return []
	}
}
// init streak table

export const getStreak = async() => {
	try {
		const db = await getDB()
        const data = await db.getFirstAsync(`SELECT * FROM streaks WHERE id = 1`) as StreakData
        if (data) return data
        else return null
	}
	catch (error) {
		console.log(error)
        return null
	}
}

export const updateStreak = async (updates: Partial<StreakData>) => {
	try {
		const db = await getDB()
		const fields = Object.keys(updates)
		const values = Object.values(updates)
		const query = fields.map(field => `${field} = ?`).join(", ")
		await db.runAsync(`UPDATE streaks SET ${query} WHERE id = 1`, values)
		console.log("Updated user streak")
	}
	catch (error) {
		console.log(error)
	}
}

export const addBookMark = async (verse: number) => {
	try {
		const db = await getDB()
		await db.runAsync(`INSERT INTO bookmarks (verse_id) VALUES (?)`, [verse])
		console.log("Added user bookmark")
	}
	catch (error) {
		console.log(error)
	}
}

export const getBookMarks = async () => {
	try {
		const db = await getDB()
		const data = await db.getAllAsync(`SELECT * FROM bookmarks`) as Bookmark[]
		if (data) {
            console.log("Fetched user bookmarks")
			return data
		}
		else return []
	}
	catch (error) {
		console.log(error)
		return []
	}
}

// export const insertWerdSegment = async (id: number, first_verse: number, last_verse: number, date: string, done: number) => {
//     try {
//         const db = await getDB()
//         await db.runAsync(`INSERT INTO werd_segments (id, first_verse, last_verse, date, done) VALUES (?, ?, ?, ?, ?)`, [id, first_verse, last_verse, date, done])
//         console.log("Added new werd segment")
//     }
//     catch (error) {
//         console.log(error)
//     }
// }

export const updateDailyProgress = async (updates: Partial<DailyProgress>, day_number: number = 1) => {
	try {
		const db = await getDB()
		const fields = Object.keys(updates)
		const values = Object.values(updates)
		values.push(day_number)
		const query = fields.map(field => `${field} = ?`).join(", ")
		await db.runAsync(`UPDATE daily_progress SET ${query} WHERE id = ?`, values)
		console.log("Updated werd segments")
	}
	catch (error) {
		console.log(error)
	}
}

export const getDailyProgress = async (day_number: number) => {
	try {
		const db = await getDB();
		const data = await db.getFirstAsync(`SELECT * FROM daily_progress WHERE day_number = ?`, [day_number]) as DailyProgress
		if (data) return data
		else return null;
	}
	catch (error) {
		console.log("Error reading werd segment")
		return null;
	}
}

// export const getAllWerdSegments = async () => {
//     try {
//         const db = await getDB()
//         const data = await db.getAllAsync(`SELECT * FROM werd_segments`) as WerdSegment[]
//         if (data) return data
//         else return []
//     }
//     catch (error) {
//         console.log(error)
//         return []
//     }
// }

// export const getDates = async (year?: number, month?: number) => {
//     try {
//         const parameters: number[] = []
//         const query = "SELECT * FROM dates WHERE "
//         if (year !== undefined) {
//             query += "year = ?"
//             parameters.push(year)
//         }
//         if (month !== undefined) parameters.push(month)
//         const db = await getDB()
//         const data = await db.getAllAsync(`SELECT * FROM dates WHERE year = ? AND month = ?`, [year, month]) as DateData[]
//         if (data) return data
//         else return []
//     }
//     catch (error) {
//         console.log(error)
//         return []
//     }
// }

export const getDates = async (year: number, month: number) => {
    try {
        const db = await getDB()
        const data = await db.getAllAsync(`SELECT * FROM dates WHERE year = ? AND month = ?`, [year, month]) as DateData[]
        if (data) return data
        else return []
    }
    catch (error) {
        console.log(error)
        return []
    }
}

export const insertDate = async (day: number, month: number, year: number, is_done: number) => {
    try {
        const db = await getDB()
        await db.runAsync(`INSERT INTO dates VALUES (?, ?, ?, ?)`, [day, month, year, is_done])
        console.log("Inserted New Date")
    }
    catch (error) {
        console.log(error)
    }
}

export const getLastStopped = async () => {
    try {
        const db = await getDB()
        const today = await db.getFirstAsync(`SELECT day_number FROM daily_progress WHERE day_number = (SELECT MIN(day_number) WHERE is_completed = 0)`)
        if (today) return today
        console.log("Retrieved Last Stop at werd")
    }
    catch (error) {
        console.log(error)
    }
}

export const getPageCount = async (first_verse: number, last_verse: number) => {
    try {
        const db = await getDB()
        // @ts-ignore
        const res = await db.getFirstAsync<{ total_pages: number }>(
            `SELECT COUNT(*) as total_pages FROM pages WHERE last_verse >= ? AND first_verse <= ?`,
            [first_verse, last_verse]
        );
        return res.total_pages ?? 0;
    }
    catch (error) {
        console.log(error)
    }
    
}

export const test = async (start: number, end: number) => {
	const verses = await fetchVerses(start, end, 'surah'); 
	if (verses && verses.length) {
		console.log("------------------------------------------");
		verses.forEach((v: any, index: number) => {
			// console.log(`[Verse ${v.id}] ${v.text}`);
		});
		console.log("------------------------------------------");
	} else {
		console.log("No verses found");
	}
}
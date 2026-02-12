import * as SQLite from "expo-sqlite"
const DB_NAME = "werd_db"
let database: SQLite.SQLiteDatabase | null = null;

interface UserSettings {
    font: string;
    font_size: number;
    reading_mode: number;
    partition_type: number;
    starting_date: string;
    ending_date: string;
    theme: number;
}

interface UserProgress {
	first_verse: number;
	last_verse: number;
	date: string;
}

interface Bookmark {
	id: number;
	verse: number;
}

const isEmpty = async (db: SQLite.SQLiteDatabase, table: string) => {
	const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table}`
    );
    return result!.count === 0;
}

export async function getDB() {
	if (!database) {
	database = await SQLite.openDatabaseAsync(DB_NAME);
	}
	return database;
}

export async function initDB(clear: number = 0) {
	try {
		const db = await getDB()

		if (clear) {
			console.log("Clearing Database")
			await db.execAsync(`
			  PRAGMA foreign_keys = OFF;
			  
			  --DROP TABLE IF EXISTS bookmarks;
			  DROP TABLE IF EXISTS werd_segments;
			  --DROP TABLE IF EXISTS pages;
			  --DROP TABLE IF EXISTS juz;
			  --DROP TABLE IF EXISTS surahs;
			  --DROP TABLE IF EXISTS verses;
			  --DROP TABLE IF EXISTS streaks;
			  --DROP TABLE IF EXISTS user_settings;
			  
			  PRAGMA foreign_keys = ON;
			`);
		}


		await db?.execAsync(`
			CREATE TABLE IF NOT EXISTS user_settings (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
                font TEXT NOT NULL,
				font_size INTEGER DEFAULT 1,
				reading_mode INTEGER DEFAULT 0,
				partition_type INTEGER DEFAULT 0,
				starting_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				ending_date TEXT NOT NULL,
                theme INT NOT NULL DEFAULT 0
			);

			CREATE TABLE IF NOT EXISTS verses (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				text TEXT NOT NULL,
				page INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS surahs (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				first_verse_id INTEGER NOT NULL,
				last_verse_id INTEGER NOT NULL,
				starting_page_id INTEGER NOT NULL,
				name TEXT NOT NULL,
				type TEXT NOT NULL,
				FOREIGN KEY (first_verse_id) REFERENCES verses(id),
				FOREIGN KEY (last_verse_id) REFERENCES verses(id)
			);

			CREATE TABLE IF NOT EXISTS juz (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				first_verse_id INTEGER NOT NULL,
				last_verse_id INTEGER NOT NULL,
				FOREIGN KEY (first_verse_id) REFERENCES verses(id),
				FOREIGN KEY (last_verse_id) REFERENCES verses(id)
			);

			CREATE TABLE IF NOT EXISTS pages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				first_verse_id INTEGER NOT NULL,
				last_verse_id INTEGER NOT NULL,
				FOREIGN KEY (first_verse_id) REFERENCES verses(id),
				FOREIGN KEY (last_verse_id) REFERENCES verses(id)
			);

			CREATE TABLE IF NOT EXISTS werd_segments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				first_verse_id INTEGER NOT NULL,
				last_verse_id INTEGER NOT NULL,
				date TEXT NOT NULL,
				FOREIGN KEY (first_verse_id) REFERENCES verses(id),
				FOREIGN KEY (last_verse_id) REFERENCES verses(id)
			);

			CREATE TABLE IF NOT EXISTS streaks (
				id INTEGER PRIMARY KEY,
				longest_streak INTEGER DEFAULT 0,
				current_streak INTEGER DEFAULT 0,
				last_date TEXT
			);

			CREATE TABLE IF NOT EXISTS bookmarks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				verse_id INTEGER NOT NULL,
				FOREIGN KEY (verse_id) REFERENCES verses(id)
			);
		`)

		if (await isEmpty(db, "user_settings")) {
			console.log("empty settings")
			await setSettings()
		}
	}
	catch (error) {
		console.log("Error Intializing Database");
		console.log(error);
	}
}

// convert relative surah id to global verse id
const globalId = async (db: SQLite.SQLiteDatabase, surah: number, verse: number) => {
	const res = await db!.getFirstAsync<{ first_verse_id: number }>(`SELECT first_verse_id FROM surahs WHERE id = ?`, [surah])
	return res!.first_verse_id+verse-1;
}

export const addQuranText = async () => {
	try {
		const db = await getDB();
		const countResult = await db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM verses"
        );

        if (countResult && countResult.count > 0) {
            console.log("Quran text already exists");
            return;
        }

		console.log("Fetching Quran Text from API")
		const request = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani");
		if (request.ok) {
			const response = await request.json();
			for (const surah of response.data.surahs) {
				for (const verse of surah.ayahs) {
					await db!.runAsync(`
						INSERT INTO VERSES (id, text, page) VALUES (?, ?, ?)`,
                        [
                            verse.number,
							verse.text,
							verse.page
                        ]		
					)
				}
			}

            for (const surah of response.data.surahs) {
                await db!.runAsync(`
					INSERT INTO surahs (id, first_verse_id, last_verse_id, starting_page_id, name, type) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
						surah.number,
						surah.ayahs[0].number,
						surah.ayahs[surah.ayahs.length-1].number,
						surah.ayahs[0].page,
						surah.englishName,
					    surah.revelationType
                    ]
				)
            }
		}

		const metaData = await fetch("https://api.alquran.cloud/v1/meta")
		if (metaData.ok) {
			const response = await metaData.json()
			for (let i = 0; i < response.data.pages.count; i++) {
				let first_verse = await globalId(db, response.data.pages.references[i].surah, response.data.pages.references[i].ayah)
				let last_verse: number
				if (i === response.data.pages.count-1) last_verse = 6236
				else last_verse = await globalId(db, response.data.pages.references[i+1].surah, response.data.pages.references[i+1].ayah)-1
				await db!.runAsync(`INSERT INTO pages (id, first_verse_id, last_verse_id) VALUES (?, ?, ?)`,
					[
						i+1,
						first_verse,
						last_verse,
					]					
				)
			}

			for (let i = 0; i < response.data.juzs.count; i++) {
				let first_verse = await globalId(db, response.data.juzs.references[i].surah, response.data.juzs.references[i].ayah)
				let last_verse: number
				if (i === response.data.juzs.count-1) last_verse = 6236
				else last_verse = await globalId(db, response.data.juzs.references[i+1].surah, response.data.juzs.references[i+1].ayah)-1
				await db!.runAsync(`INSERT INTO juz (id, first_verse_id, last_verse_id) VALUES (?, ?, ?)`,
					[
						i+1,
						first_verse,
						last_verse,
					]					
				)
			}
		}
		console.log("Added Quran Text")
	}
	catch (error) {
		console.log("Error Adding Quran Text");
		console.log(error)
	}
}


export const fetchVerses = async (l: number, r: number, partitionType: number) => {
    const db = await getDB();
    let first_verse = l, last_verse = r; // verses by default

    try {
        if (partitionType === 1) { // surahs
            const resL = await db.getFirstAsync<{first_verse_id: number}>(`SELECT first_verse_id FROM surahs WHERE id = ?`, [l]);
            const resR = await db.getFirstAsync<{last_verse_id: number}>(`SELECT last_verse_id FROM surahs WHERE id = ?`, [r]);
            if (resL) first_verse = resL.first_verse_id;
            if (resR) last_verse = resR.last_verse_id;
        }
        else if (partitionType === 2) { // juz
            const resL = await db.getFirstAsync<{first_verse_id: number}>(`SELECT first_verse_id FROM juz WHERE id = ?`, [l]);
            const resR = await db.getFirstAsync<{last_verse_id: number}>(`SELECT last_verse_id FROM juz WHERE id = ?`, [r]);
            if (resL) first_verse = resL.first_verse_id;
            if (resR) last_verse = resR.last_verse_id;
        }
        else if (partitionType === 3) { // pages
            const resL = await db.getFirstAsync<{first_verse_id: number}>(`SELECT first_verse_id FROM pages WHERE id = ?`, [l]);
            const resR = await db.getFirstAsync<{last_verse_id: number}>(`SELECT last_verse_id FROM pages WHERE id = ?`, [r]);
            if (resL) first_verse = resL.first_verse_id;
            if (resR) last_verse = resR.last_verse_id;
        }

        const data = await db.getAllAsync(`SELECT * FROM verses WHERE id >= ? AND id <= ?`, [first_verse, last_verse]);
        return data;

    } catch (error) {
        console.error("Fetch Verses Error:", error);
        return [];
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

export const setSettings = async (
    id: number = 1,
    font: string = "D1",
    font_size: number = 14,
    reading_mode: number = 0,
    partition_type: number = 0,
    starting_date: string = "6/6/2006",
    ending_date: string = "7/7/2007",
    theme: number = 0) => {
		try {
			const db = await getDB()
			let query: string
			if (await isEmpty(db, "user_settings")) {
				await db.runAsync(`
					INSERT INTO user_settings VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
					[id, font, font_size, reading_mode, partition_type, starting_date, ending_date, theme])
			}
			else {
				await db.runAsync(`
					UPDATE user_settings
					SET font = ?,
					font_size = ?,
					reading_mode = ?,
					partition_type = ?,
					starting_date = ?,
					ending_date = ?,
					theme = ?`,
					[font, font_size, reading_mode, partition_type, starting_date, ending_date, theme])
			}
				console.log("Settings Modified")
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
        const db = await getDB()
        const data = await db.getAllAsync(`SELECT * FROM user_settings WHERE id = ?`, [id])
        if (data) return data
    }
    catch (error) {
        console.log(error)
        return []
    }
}

export const addProgress = async (first_verse: number, last_verse: number, date: string) => {
	try {
		const db = await getDB()
		await db.runAsync(`INSERT INTO werd_segments (first_verse_id, last_verse_id, date) VALUES (?, ?, ?)`, [first_verse, last_verse, date])
		console.log("Added user progress")
	}
	catch (error) {
		console.log(error)
	}
}

export const getUserProgress = async () => {
	try {
		const db = await getDB()
		const data = await db.getAllAsync(`SELECT * FROM werd_segments`) as UserProgress[]
		if (data) {
			console.log("Fetched user progress")
			return data
		}
		else return []
	}
	catch (error) {
		console.log(error)
		return []
	}
}

export const updateStreak = async (updates: Partial<UserProgress>, id: number = 1) => {
	try {
		const db = await getDB()
		const fields = Object.keys(updates)
		const values = Object.values(updates)
		values.push(id)
		const query = fields.map(field => `${field} = ?`).join(", ")
		await db.runAsync(`UPDATE streaks SET ${query} WHERE id = ?`, values)
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
		console.log("Added user progress")
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
			console.log("Added user progress")
			return data
		}
		else return []
	}
	catch (error) {
		console.log(error)
		return []
	}
}



export const test = async (start: number, end: number) => {
	// const verses = await fetchVerses(start, end, 2); 
	// if (verses && verses.length) {
	// 	console.log("------------------------------------------");
	// 	verses.forEach((v: any, index: number) => {
	// 		console.log(`[Verse ${v.id}] ${v.text}`);
	// 	});
	// 	console.log("------------------------------------------");
	// } else {
	// 	console.log("No verses found");
	// }
	console.log("testing...")
	const settings = await getSettings() as UserSettings[]
	if (settings && settings.length > 0) {
    	console.log(`${settings[0].font}`);
		console.log(`${settings[0].theme}`);
		console.log(`${settings[0].reading_mode}`);
	}
}
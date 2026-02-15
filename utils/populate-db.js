// populate-db.js
const Database = require('better-sqlite3');
const fs = require('fs');

const DB_NAME = "werd_db.db";

// Load your JSON files
const quranData = JSON.parse(fs.readFileSync('./quran.json', 'utf8'));
const metaData = JSON.parse(fs.readFileSync('./meta.json', 'utf8'));

// Create database
const db = new Database(DB_NAME);

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        relative_id INTEGER NOT NULL,
        surah_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        page INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS surahs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_verse INTEGER NOT NULL,
        last_verse INTEGER NOT NULL,
        starting_page_id INTEGER NOT NULL,
        arabicName TEXT NOT NULL,
        englishName TEXT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (first_verse) REFERENCES verses(id),
        FOREIGN KEY (last_verse) REFERENCES verses(id)
    );

    CREATE TABLE IF NOT EXISTS juz (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_verse INTEGER NOT NULL,
        last_verse INTEGER NOT NULL,
        FOREIGN KEY (first_verse) REFERENCES verses(id),
        FOREIGN KEY (last_verse) REFERENCES verses(id)
    );

    CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_verse INTEGER NOT NULL,
        last_verse INTEGER NOT NULL,
        FOREIGN KEY (first_verse) REFERENCES verses(id),
        FOREIGN KEY (last_verse) REFERENCES verses(id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        font TEXT NOT NULL,
        font_size INTEGER DEFAULT 1,
        reading_mode INTEGER DEFAULT 0,
        partition_type INTEGER DEFAULT 0,
        starting_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ending_date TEXT NOT NULL,
        theme INT NOT NULL DEFAULT 0,
        language TEXT NOT NULL DEFAULT "en",
        currentWerd INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS werd_segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_verse INTEGER NOT NULL,
        last_verse INTEGER NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (first_verse) REFERENCES verses(id),
        FOREIGN KEY (last_verse) REFERENCES verses(id)
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
`);

console.log("Tables created");

// Helper function
const globalId = (surah, verse) => {
    const stmt = db.prepare('SELECT first_verse FROM surahs WHERE id = ?');
    const result = stmt.get(surah);
    return result.first_verse + verse - 1;
};

// Insert verses
console.log("Inserting verses...");
const insertVerse = db.prepare(`
    INSERT INTO verses (id, relative_id, surah_id, text, page) 
    VALUES (?, ?, ?, ?, ?)
`);

let sur = 1;
for (const surah of quranData.data.surahs) {
    let cnt = 1;
    for (const verse of surah.ayahs) {
        insertVerse.run(verse.number, cnt, sur, verse.text, verse.page);
        cnt++;
    }
    sur++;
}

console.log("Verses inserted");

// Insert surahs
console.log("Inserting surahs...");
const insertSurah = db.prepare(`
    INSERT INTO surahs (id, first_verse, last_verse, starting_page_id, arabicName, englishName, type) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const surah of quranData.data.surahs) {
    insertSurah.run(
        surah.number,
        surah.ayahs[0].number,
        surah.ayahs[surah.ayahs.length - 1].number,
        surah.ayahs[0].page,
        surah.name,
        surah.englishName,
        surah.revelationType
    );
}

console.log("Surahs inserted");

// Insert pages
console.log("Inserting pages...");
const insertPage = db.prepare(`
    INSERT INTO pages (id, first_verse, last_verse) 
    VALUES (?, ?, ?)
`);

for (let i = 0; i < metaData.data.pages.count; i++) {
    let first_verse = globalId(
        metaData.data.pages.references[i].surah,
        metaData.data.pages.references[i].ayah
    );
    let last_verse;
    
    if (i === metaData.data.pages.count - 1) {
        last_verse = 6236;
    } else {
        last_verse = globalId(
            metaData.data.pages.references[i + 1].surah,
            metaData.data.pages.references[i + 1].ayah
        ) - 1;
    }
    
    insertPage.run(i + 1, first_verse, last_verse);
}

console.log("Pages inserted");

// Insert juz
console.log("Inserting juz...");
const insertJuz = db.prepare(`
    INSERT INTO juz (id, first_verse, last_verse) 
    VALUES (?, ?, ?)
`);

for (let i = 0; i < metaData.data.juzs.count; i++) {
    let first_verse = globalId(
        metaData.data.juzs.references[i].surah,
        metaData.data.juzs.references[i].ayah
    );
    let last_verse;
    
    if (i === metaData.data.juzs.count - 1) {
        last_verse = 6236;
    } else {
        last_verse = globalId(
            metaData.data.juzs.references[i + 1].surah,
            metaData.data.juzs.references[i + 1].ayah
        ) - 1;
    }
    
    insertJuz.run(i + 1, first_verse, last_verse);
}

console.log("Juz inserted");

// Insert default settings
console.log("Inserting default settings...");
db.prepare(`
    INSERT INTO user_settings (id, font, font_size, reading_mode, partition_type, starting_date, ending_date, theme, language, currentWerd) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(1, "D1", 14, 0, 0, "6/6/2006", "7/7/2007", 0, "en", 1);

// Insert default werd segment
db.prepare(`
    INSERT INTO werd_segments (id, first_verse, last_verse, date) 
    VALUES (?, ?, ?, ?)
`).run(1, 10, 100, "8/8/2008");

console.log("Default data inserted");

db.close();
console.log("Database created successfully: " + DB_NAME);
import { SQLiteDatabase } from 'expo-sqlite';
import { ReadingSession, SurahSegment, AyahData } from '../types/quran_data'

export class QuranService {
    constructor(private db: SQLiteDatabase) {}

    async getTodaysWerd(): Promise<ReadingSession | null> {
        const progress = await this.db.getFirstAsync<{day_number: number, start_page: number, end_page: number}>(`
            SELECT * FROM daily_progress WHERE is_completed = 0 ORDER BY day_number ASC LIMIT 1    
        `)

        if(!progress) return null;

        const rawAyahs = await this.db.getAllAsync<any>(`
            SELECT * FROM ayahs
            WHERE page >= ? AND page <= ?
            ORDER BY surah_id, number_in_surah
        `, [progress.start_page, progress.end_page]);

        const segments: SurahSegment[] = [];
        let currentSurahId = -1;
        let currentSegment: SurahSegment | null = null;

        for(const row of rawAyahs) {
            if(row.surah_id !== currentSurahId) {
                currentSurahId = row.surah_id;

                if(currentSegment) segments.push(currentSegment);

                currentSegment = {
                    surahId: row.surah_id,
                    surahNameArabic: row.surah_name_ar,
                    surahNameEnglish: row.surah_name_en,
                    surahType: row.type,
                    ayahs: []
                };

                if(currentSegment) {
                    currentSegment.ayahs.push({
                        number: row.number_in_surah,
                        text: row.text
                    });
                }
            }
        }

        if(currentSegment) segments.push(currentSegment);

        return {
            sessionId: `day-${progress.day_number}`,
            sessionType: `daily_werd`,
            segments: segments
        }
    }
}
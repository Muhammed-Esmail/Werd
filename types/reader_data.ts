export type SessionType = 'daily_werd' | 'full_surah' | 'custom_range';

export interface ReaderParams {
  surahId?: number;
  sessionType: SessionType;
}

interface Surah {
	id: number;
	first_verse: number;
	last_verse: number;
	starting_page_id: number;
	ayahs: number,
	arabicName: string;
	englishName: string;
	type: string;
}
export const SURAH_DATA : Surah[] = [];
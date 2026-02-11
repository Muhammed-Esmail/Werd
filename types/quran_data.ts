import { InteractionManager } from "react-native";

export interface AyahData{
    number: number;
    text: string;
}

export interface SurahSegment {
  surahId: number;
  surahNameArabic?: string;
  surahNameEnglish?: string;
  surahType?: 'Meccan' | 'Medinan';
  ayahs: AyahData[];  // Complete text included
}

export interface ReadingSession {
  sessionId: string;
  sessionType: 'daily_werd' | 'full_surah' | 'custom_range';
  segments: SurahSegment[];
}

export type PageItem = 
  | { type: 'header'; surahId: number }
  | { type: 'ayah'; data: AyahData };

export interface QuranPage {
  pageIndex: number;
  items: PageItem[];
}
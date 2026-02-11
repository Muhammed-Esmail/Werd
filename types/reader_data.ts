export type SessionType = 'daily_werd' | 'full_surah' | 'custom_range';

export interface ReaderParams {
  surahId: number;
  sessionType: SessionType;
}
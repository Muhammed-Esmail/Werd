// mocks/quranData.ts (or wherever you want to put it)
import { ReadingSession, SurahSegment } from './../quran_data';

/**
 * Mock data for Surah Al-Fatihah (The Opening)
 * Complete with all 7 ayahs
 */
export const MOCK_SURAH_AL_FATIHAH: ReadingSession = {
  sessionId: "mock-fatihah-full",
  sessionType: "full_surah",
  segments: [
    {
      surahId: 1,
      surahNameArabic: "الفاتحة",
      surahNameEnglish: "Al-Fatihah",
      surahType: "Meccan",
      ayahs: [
        {
          number: 1,
          text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ"
        },
        {
          number: 2,
          text: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
        },
        {
          number: 3,
          text: "مَـٰلِكِ يَوْمِ ٱلدِّينِ"
        },
        {
          number: 4,
          text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ"
        },
        {
          number: 5,
          text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ"
        },
        {
          number: 6,
          text: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
        }
      ]
    }
  ],
};

/**
 * Mock data for a partial read (testing range functionality)
 * Al-Fatihah ayahs 1-3 only
 */
export const MOCK_PARTIAL_FATIHAH: ReadingSession = {
  sessionId: "mock-fatihah-partial",
  sessionType: "custom_range",
  segments: [
    {
      surahId: 1,
      surahNameArabic: "الفاتحة",
      surahNameEnglish: "Al-Fatihah",
      surahType: "Meccan",
      ayahs: [
        {
          number: 1,
          text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ"
        },
        {
          number: 2,
          text: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
        }
      ]
    }
  ],
};

/**
 * Mock data for multi-surah reading
 * Last 3 ayahs of Al-Fatihah + First 3 ayahs of Al-Baqarah
 * (Good for testing segment transitions)
 */
export const MOCK_MULTI_SURAH_READING: ReadingSession = {
  sessionId: "mock-multi-surah",
  sessionType: "daily_werd",
  segments: [
    {
      surahId: 1,
      surahNameArabic: "الفاتحة",
      surahNameEnglish: "Al-Fatihah",
      surahType: "Meccan",
      ayahs: [
        {
          number: 5,
          text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ"
        },
        {
          number: 6,
          text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ"
        },
        {
          number: 7,
          text: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
        }
      ]
    },
    {
      surahId: 2,
      surahNameArabic: "البقرة",
      surahNameEnglish: "Al-Baqarah",
      surahType: "Medinan",
      ayahs: [
        {
          number: 1,
          text: "الٓمٓ"
        },
        {
          number: 2,
          text: "ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ"
        },
        {
          number: 3,
          text: "ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ"
        }
      ]
    }
  ],
};

/**
 * Helper function to get mock data by type
 */
export const getMockReadingData = (type: 'full' | 'partial' | 'multi'): ReadingSession => {
  switch (type) {
    case 'full':
      return MOCK_SURAH_AL_FATIHAH;
    case 'partial':
      return MOCK_PARTIAL_FATIHAH;
    case 'multi':
      return MOCK_MULTI_SURAH_READING;
    default:
      return MOCK_SURAH_AL_FATIHAH;
  }
};
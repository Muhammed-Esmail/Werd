import { PageAtom, PageItem, ReadingSession } from "@/types/quran_data";

export const segmentSessionIntoItems = (
  segments: ReadingSession['segments'],
): PageItem[] => {
  const items: PageItem[] = [];

  segments.forEach((segment) => {
    // 1. Add the Surah Header atom
    items.push({ 
      type: 'header', 
      surahId: segment.surahId 
    });

    // 2. Add each Ayah atom
    segment.ayahs.forEach((ayah) => {
      items.push({ 
        type: 'ayah', 
        data: ayah 
      });
    });
  });

  return items;
};

export const segmentSessionIntoAtoms = (
  segments: ReadingSession['segments'],
): PageAtom[] => {
  const items: PageAtom[] = [];

  segments.forEach((segment) => {
    // 1. Add the Surah Header
    items.push({ 
      type: 'header', 
      surahId: segment.surahId 
    });

    // 2. Process Ayahs into Words + Markers
    segment.ayahs.forEach((ayah) => {
      // Split by space to get individual words
      const words = ayah.text.trim().split(/\s+/);
      
      words.forEach((word) => {
        items.push({
          type: 'word',
          text: word
        });
      });

      // 3. Add the Ayah Marker after the last word of the ayah
      items.push({
        type: 'ayahMarker',
        number: ayah.number
      });
    });
  });

  return items;
};
import { ReadingSession, AyahData as AyahType } from '@/types/quran_data';

// --- Configuration ---
export const PAGE_HEIGHT_PERCENTAGE = 0.85; 
const LINE_HEIGHT = 20;
const CHARS_PER_LINE = 40; 
const HEADER_HEIGHT = 40; 
const BISMILLAH_HEIGHT = 50;
const PAGE_PADDING = 0; 
const BUFFER = 20;

export type PageItem = 
  | { type: 'header'; surahId: number }
  | { type: 'ayah'; data: AyahType };

export interface QuranPage {
  pageIndex: number;
  items: PageItem[];
}

// Helper to get height of any item
const getItemHeight = (item: PageItem): number => {
  if (item.type === 'header') {
    // Surah 9 (Tawbah) has no Bismillah, so it's shorter
    return item.surahId === 9 ? HEADER_HEIGHT : HEADER_HEIGHT + BISMILLAH_HEIGHT;
  }
  
  // Calculate Ayah height based on text length
  const lines = Math.ceil(item.data.text.length / CHARS_PER_LINE);
  return (lines * LINE_HEIGHT) + BUFFER;
};

export const segmentSessionIntoPages = (
  segments: ReadingSession['segments'], 
  screenHeight: number
): QuranPage[] => {
  
  const MAX_HEIGHT = (screenHeight * PAGE_HEIGHT_PERCENTAGE) - PAGE_PADDING;
  
  const pages: QuranPage[] = [];
  let currentPageItems: PageItem[] = [];
  let currentHeight = 0;
  let pageIndex = 0;

  // Helper to close the current page and start a new one
  const startNewPage = () => {
    if (currentPageItems.length > 0) {
      pages.push({ pageIndex, items: [...currentPageItems] });
      pageIndex++;
      currentPageItems = [];
      currentHeight = 0;
    }
  };

  segments.forEach((segment) => {
    
    // 1. Handle the Header
    const headerItem: PageItem = { type: 'header', surahId: segment.surahId };
    const headerH = getItemHeight(headerItem);

    if (currentHeight + headerH > MAX_HEIGHT) {
      startNewPage();
    }
    currentPageItems.push(headerItem);
    currentHeight += headerH;

    // 2. Handle the Ayahs
    segment.ayahs.forEach((ayah) => {
      const ayahItem: PageItem = { type: 'ayah', data: ayah };
      const ayahH = getItemHeight(ayahItem);

      if (currentHeight + ayahH > MAX_HEIGHT) {
        startNewPage();
      }
      
      currentPageItems.push(ayahItem);
      currentHeight += ayahH;
    });
  });

  // Push whatever is left in the buffer
  if (currentPageItems.length > 0) {
    pages.push({ pageIndex, items: currentPageItems });
  }

  return pages;
};
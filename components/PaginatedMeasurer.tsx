import { PageAtom } from "@/types/quran_data";
import { useState } from "react";
import { View } from "react-native";
import { ReaderPageAtom } from "./ReaderPageAtom";
import React from "react";

interface PaginatedMeasureProps {
  allItems: PageAtom[];
  targetHeight: number;
  onPageGenerated: (
    page: PageAtom[], 
    last: boolean, 
    firstAyah: { surahId: number; ayahNumber: number } | null
  ) => void;
}

// Configuration
const CHARS_PER_PAGE = 120;
const BUFFER_SIZE = 30;           
const MIN_JUMP = 5;               
const MAX_JUMP = 15;              
const BUFFER = 20;

function estimatePageEnd(atoms: PageAtom[], start: number): number {
  let charCount = 0;
  
  for (let i = start; i < atoms.length; i++) {
    if (atoms[i].type === 'word') {
      // @ts-ignore
      charCount += atoms[i].text.length;
    }
    if (charCount > CHARS_PER_PAGE) {
      return Math.min(i + BUFFER_SIZE, atoms.length);
    }
  }
  
  return atoms.length;
}

function getFirstAyahInfo(allItems: PageAtom[], startIndex: number) {
  if (!allItems || allItems.length === 0 || startIndex >= allItems.length) return null;

  let surahId = 1;
  let ayahNumber = 1;

  for (let i = startIndex; i >= 0; i--) {
    const atom = allItems[i] as any;
    if (atom.type === 'header' && atom.surahId !== undefined) {
      surahId = atom.surahId;
      break;
    }
  }

  const firstAtom = allItems[startIndex] as any;
  if (firstAtom && firstAtom.type === 'header') {
    ayahNumber = 1;
  } else {
    let foundMarker = false;
    for (let i = startIndex; i < allItems.length; i++) {
      const atom = allItems[i] as any;
      if (atom.type === 'ayahMarker' && atom.number !== undefined) {
        ayahNumber = atom.number;
        foundMarker = true;
        break;
      } else if (atom.type === 'header' && i !== startIndex) {
        ayahNumber = 1;
        foundMarker = true;
        break;
      }
    }

    if (!foundMarker) {
      for (let i = startIndex; i >= 0; i--) {
        const atom = allItems[i] as any;
        if (atom.type === 'ayahMarker' && atom.number !== undefined) {
          ayahNumber = atom.number + 1;
          break;
        }
      }
    }
  }

  return { surahId, ayahNumber };
}

export const PaginatedMeasurer = ({ allItems, targetHeight, onPageGenerated }: PaginatedMeasureProps) => {
  const [currentStart, setCurrentStart] = useState(0);
  const [testEnd, setTestEnd] = useState(() => estimatePageEnd(allItems, 0));
  const [lastValidEnd, setLastValidEnd] = useState(0);
  const [measureCount, setMeasureCount] = useState(0);

  const handleLayout = (event: any) => {
    const measuredHeight = event.nativeEvent.layout.height;
    setMeasureCount(prev => prev + 1);

    if (measuredHeight + BUFFER > targetHeight) {
      if (testEnd === lastValidEnd + 1) {
        const pageAtoms = allItems.slice(currentStart, lastValidEnd);
        
        const firstAyah = getFirstAyahInfo(allItems, currentStart); 
        
        onPageGenerated(pageAtoms, false, firstAyah);
        console.log(`✅ Page: ${pageAtoms.length} atoms, ${measureCount} measurements`);
        
        const nextStart = lastValidEnd;
        setCurrentStart(nextStart);
        setLastValidEnd(nextStart);
        setMeasureCount(0);
        setTestEnd(estimatePageEnd(allItems, nextStart));
      } else {
        const midpoint = lastValidEnd + Math.max(1, Math.floor((testEnd - lastValidEnd) / 2));
        setTestEnd(midpoint);
      }
    } else {
      if (testEnd >= allItems.length) {
        const pageAtoms = allItems.slice(currentStart, allItems.length);
        
        const firstAyah = getFirstAyahInfo(allItems, currentStart); 
        
        onPageGenerated(pageAtoms, true, firstAyah);
        console.log(`✅ Final page: ${allItems.length - currentStart} atoms, ${measureCount} measurements`);
        return;
      }

      setLastValidEnd(testEnd);
      
      const remaining = allItems.length - testEnd;
      const jump = Math.min(MAX_JUMP, Math.max(MIN_JUMP, Math.floor(remaining / 20)));
      setTestEnd(prev => Math.min(prev + jump, allItems.length));
    }
  };

  return (
    <View 
      style={{ position: 'absolute', opacity: 0, width: '100%', left: -1000 }}
      onLayout={handleLayout}
      key={`measure-${currentStart}-${testEnd}`}
    >
      <ReaderPageAtom items={allItems.slice(currentStart, testEnd)} />
    </View>
  );
};
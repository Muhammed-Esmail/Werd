import { PageAtom } from "@/types/quran_data";
import { useState } from "react";
import { View } from "react-native";
import { ReaderPageAtom } from "./ReaderPageAtom";
import React from "react";

interface PaginatedMeasureProps {
  allItems: PageAtom[];
  targetHeight: number;
  onPageGenerated: (page: PageAtom[], last: boolean) => void;
}

// Configuration
const CHARS_PER_PAGE = 120;      // Target characters per page
const BUFFER_SIZE = 30;           // Extra atoms added to initial estimate
const MIN_JUMP = 5;               // Minimum atoms to jump when searching
const MAX_JUMP = 15;              // Maximum atoms to jump when searching

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

export const PaginatedMeasurer = ({ allItems, targetHeight, onPageGenerated }: PaginatedMeasureProps) => {
  const [currentStart, setCurrentStart] = useState(0);
  const [testEnd, setTestEnd] = useState(() => estimatePageEnd(allItems, 0));
  const [lastValidEnd, setLastValidEnd] = useState(0);
  const [measureCount, setMeasureCount] = useState(0);

  const handleLayout = (event: any) => {
    const measuredHeight = event.nativeEvent.layout.height;
    setMeasureCount(prev => prev + 1);

    if (measuredHeight > targetHeight) {
      // Content overflows - need to reduce
      if (testEnd === lastValidEnd + 1) {
        // Found exact split point
        const pageAtoms = allItems.slice(currentStart, lastValidEnd);
        onPageGenerated(pageAtoms, false);
        console.log(`✅ Page: ${pageAtoms.length} atoms, ${measureCount} measurements`);
        
        const nextStart = lastValidEnd;
        setCurrentStart(nextStart);
        setLastValidEnd(nextStart);
        setMeasureCount(0);
        setTestEnd(estimatePageEnd(allItems, nextStart));
      } else {
        // Binary search backward
        const midpoint = lastValidEnd + Math.max(1, Math.floor((testEnd - lastValidEnd) / 2));
        setTestEnd(midpoint);
      }
    } else {
      // Content fits - can add more
      if (testEnd >= allItems.length) {
        // Reached the end
        onPageGenerated(allItems.slice(currentStart, allItems.length), true);
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
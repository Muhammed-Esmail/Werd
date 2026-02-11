
import { PageAtom } from "@/types/quran_data";
import { useState } from "react";
import { View } from "react-native";
import { ReaderPageAtom } from "./ReaderPageAtom";

interface PaginatedMeasureProps {
    allItems: PageAtom[];
    targetHeight: number;
    onPageGenerated: (page: PageAtom[], last: boolean) => void;
}

export const PaginatedMeasurer = ({ allItems, targetHeight, onPageGenerated }: PaginatedMeasureProps) => {
  const JUMP_SIZE = 150; // How many atoms to jump when we have plenty of space
  
  const [currentStart, setCurrentStart] = useState(0);
  const [testEnd, setTestEnd] = useState(JUMP_SIZE); 
  const [lastValidEnd, setLastValidEnd] = useState(0);

  const handleLayout = (event: any) => {
    const measuredHeight = event.nativeEvent.layout.height;

    if (measuredHeight > targetHeight) {
      // --- OVERFLOW: We must find the exact last atom that fits ---
      
      if (testEnd === lastValidEnd + 1) {
        // SUCCESS: We found the limit. lastValidEnd is the last index that fit.
        const finalPageAtoms = allItems.slice(currentStart, lastValidEnd);
        onPageGenerated(finalPageAtoms, false);
        
        // Setup for the next page
        const nextStart = lastValidEnd;
        setCurrentStart(nextStart);
        setLastValidEnd(nextStart);
        setTestEnd(Math.min(nextStart + JUMP_SIZE, allItems.length));
      } else {
        // NARROW DOWN: Backtrack to the middle of the last known good and current fail
        const newTestEnd = lastValidEnd + Math.max(1, Math.floor((testEnd - lastValidEnd) / 2));
        setTestEnd(newTestEnd);
      }
    } else {
      // --- UNDER LIMIT: We can fit more ---
      
      if (testEnd >= allItems.length) {
        // We reached the end of the Surah before filling the page
        onPageGenerated(allItems.slice(currentStart, allItems.length), true);
        return;
      }

      // Record this as the last known "Good" state
      setLastValidEnd(testEnd);

      // Determine next jump
      setTestEnd(prev => Math.min(prev + JUMP_SIZE, allItems.length));
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
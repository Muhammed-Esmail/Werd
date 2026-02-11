import { View, Text } from "react-native";
import { SurahHeader } from "./SurahHeader";
import { Bismillah } from "./Bismillah";
import { Ayah } from "./Ayah";
import { PageAtom } from "@/types/quran_data";

interface Props {
  items: PageAtom[];
}

const formatAyahNumber = (number: number): string => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    
    let formattedNumber= number
    .toString()
    .split('')
    .map(digit => arabicNumerals[parseInt(digit)])
    .join('');

    return `﴿${formattedNumber}﴾`;
}


export const ReaderPageAtom = ({ items }: Props) => {
  if (!items || items.length === 0) return null;

  // @ts-ignore
  const renderedContent = [];
  let currentAyahBucket: any[] = [];

  // Helper to flush the accumulated ayahs into a single Text component
  const flushAyahs = (keySuffix: string | number) => {
    
    if (currentAyahBucket.length <= 0) return;

    renderedContent.push(
        <Text
            key={`text-group-${keySuffix}`}
            className="text-right text-white text-[24px] leading-[40px] mt-2 ml-2"
            style={{ fontFamily: 'U3', textAlign: 'justify', writingDirection: 'rtl'}}
        >
            {currentAyahBucket}
        </Text>
    );
    currentAyahBucket = [];

  };

  items.forEach((item, index) => {
    if (item.type === 'header') {
      flushAyahs(index);

      renderedContent.push(
        <View key={`header-${item.surahId}-${index}`} className="mb-4">
            {/* @ts-ignore */}
          <SurahHeader surahId={item.surahId} />
          {item.surahId !== 9 && <Bismillah />}
        </View>
      );
    } else if (item.type === 'word') {
      currentAyahBucket.push(
            `${item.text} `
      );
    }
    else if (item.type === 'ayahMarker') {
        currentAyahBucket.push(
            formatAyahNumber(item.number)
        );
    }
  });

  // 4. Final flush for ayahs at the end of the page
  flushAyahs('final');

  return (
    <View className="w-full px-4 h-full">
        {/* @ts-ignore */}
      {renderedContent}
    </View>
  );
};
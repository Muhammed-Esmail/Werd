import { Image, View } from "react-native"
import { SURAH_NAMES } from "@/constants/surah_assets"

export const SurahHeader = ({ surahId }: { surahId: number }) => {
  // Grab the SVG component from our map
  const SurahPng = SURAH_NAMES[surahId];

  return (
    <View className="h-[100px] w-full justify-center items-center overflow-hidden border-b border-t border-white/30">
        {SurahPng && (
            <Image
                source={SurahPng}
                className="w-full" 
                style={{ 
                    height: 150, // Large height to allow "cropping" via the parent View
                    position: 'absolute',
                    tintColor: '#FFFFFF'                 
                }} 
                resizeMode="contain"
            />
        )}
    </View>
  );
}
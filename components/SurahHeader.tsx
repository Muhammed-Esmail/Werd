import { Image, View } from "react-native"
import { SURAH_NAMES } from "@/constants/surah_assets"
import { useAppSettings } from "@/services/useAppSettings";
import React from "react";

export const SurahHeader = ({ surahId }: { surahId: number }) => {
  // Grab the SVG component from our map
  const SurahPng = SURAH_NAMES[surahId];
  const { theme } =  useAppSettings();
  const tint = (!theme?  '#FFFFFF' : '#000000');
  console.log(theme);

  return (
    <View 
        className="h-[100px] w-full justify-center items-center overflow-hidden border-b border-t border-l border-r"
        style={{ 
            borderColor: tint
        }}    
    >
        {SurahPng && (
            <Image  
                source={SurahPng}
                className="w-full"
                style={{
                    height: 150,
                    position: 'absolute',
                    tintColor: tint
                }} 
                resizeMode="contain"
            />
        )}
    </View>
  );
}
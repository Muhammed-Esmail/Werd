import { Image, View } from "react-native"
import { useAppSettings } from "@/services/useAppSettings";
import React from 'react';
import { useSearchParams } from "expo-router/build/hooks";

const BismillahImg = require('@/assets/surah_names/bismillah.png');

export const Bismillah = ({surahID} : {surahID : number}) => {
    
    const { theme } = useAppSettings();
    const tint = (!theme? '#FFFFFF' : '#000000');

    return (
        (surahID !== 1 && surahID !== 9) ?
            <View className="h-[45px] w-full mb-2 mt-6 justify-center items-center border-white/30">
                <Image 
                    source={BismillahImg} 
                    className="w-full" 
                    style={{ 
                        height: 150, 
                        position: 'absolute',
                        tintColor: tint 
                    }} 
                    resizeMode="contain"
                />
            </View>
        :
        <View>
        </View>
        
    )
}
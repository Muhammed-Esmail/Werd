import { SurahSegment } from '@/types/quran_data'
import { SurahHeader } from './SurahHeader'
import { Bismillah } from './Bismillah';
import { Text, View } from 'react-native';
import { Ayah } from './Ayah';
import { useAppSettings } from '@/services/useAppSettings';
import React from 'react';

interface Props{
    segment: SurahSegment;
    isLastSegment: boolean;
}

export const SurahSection = ({ segment, isLastSegment } : Props) => {
    
    const { font, theme } =  useAppSettings();
    console.log(font);
    
    const showBismillah = segment.surahId !== 9;
    const textColor = (!theme ? 'white' : 'black');
    
    console.log("SURAH THEME: " + theme);
    console.log(textColor);

    return (
        <View>

            {/* Surah Name */}
            <SurahHeader surahId={segment.surahId}/>

            {/* Bismillah */}
            {showBismillah && <Bismillah surahID={segment.surahId}/>}
            
            {/* Ayaht */}
            <View className='mr-3 mb-5'>
                <Text className='text-right text-[24px] leading-[40px] mt-2 ml-3' style={{ fontFamily: font || 'Amiri-Regular', writingDirection: 'rtl', textAlign: 'justify', color:textColor }}>
                    {segment.ayahs.map(({text, number}) => (
                        <Ayah key={number} text={text} number={number}/>
                    ))}                    
                </Text>
            </View>
        </View>
    )
}
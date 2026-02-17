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
    
    const { font } =  useAppSettings();
    console.log(font);
    
    const showBismillah = segment.surahId !== 9;

    return (
        <View>

            {/* Surah Name */}
            <SurahHeader surahId={segment.surahId}/>

            {/* Bismillah */}
            {showBismillah && <Bismillah surahID={segment.surahId}/>}
            
            {/* Ayaht */}
            <View className='mr-3 mb-5'>
                <Text className='text-right text-white text-[24px] leading-[40px] mt-2 ml-3' style={{ fontFamily: font, writingDirection: 'rtl', textAlign: 'justify' }}>
                    {segment.ayahs.map(({text, number}) => (
                        <Ayah key={number} text={text} number={number}/>
                    ))}                    
                </Text>
            </View>
        </View>
    )
}
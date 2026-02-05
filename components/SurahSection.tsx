import { SurahSegment } from '@/types/quran_data'
import { SurahHeader } from './SurahHeader'
import { Bismillah } from './Bismillah';
import { Text, View } from 'react-native';
import { Ayah } from './Ayah';


interface Props{
    segment: SurahSegment;
    isLastSegment: boolean;
}

export const SurahSection = ({ segment, isLastSegment } : Props) => {
    
    const showBismillah = segment.surahId !== 9;

    return (
        <View>

            {/* Surah Name */}
            <SurahHeader surahId={segment.surahId}/>

            {/* Bismillah */}
            {showBismillah && <Bismillah/>}
            
            {/* Ayaht */}
            <View className='mr-3 mr-3'>
                <Text className=''>
                    {segment.ayahs.map(({text, number}) => (

                        <Ayah text={text} number={number}/>

                    ))}
                </Text>
            </View>
        </View>
    )
}
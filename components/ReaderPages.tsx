import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { getMockReadingData } from "@/types/mocks/mock_data";
import { Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { segmentSessionIntoPages } from "@/utils/pagination";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderPageItem } from "./ReaderPageItem";
Text
export const ReaderPages = () => {
    
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const { surahId, sessionType } = useLocalSearchParams<{ 
        surahId: string;
        sessionType: string;
    }>();

    if(sessionType === 'full_surah') {
        console.log('Full Surah Session for Surah ID:', surahId);
    }

    if(sessionType === 'daily_werd') {
        console.log('Daily Werd Session');
    }

    const segments = getMockReadingData('full');

    const { height } = useWindowDimensions();
    
    const pages = useMemo(() => {
            if (!segments) return [];
            return segmentSessionIntoPages(segments.segments, height);
        }, [segments, height]);

    const firstPageIdx = 0;
    const lastPageIdx = pages.length - 1; 

    return (
        <SafeAreaView className='bg-matteBlack h-full'>
            
            <Stack.Screen options={{ headerShown: false }} />

            <View className="h-[85%]">
                <ReaderPageItem items={pages[currentPageIndex]?.items || []}/>
            </View>

            <View className='flex-row m-5 justify-between items-center p-4'>
                

                <TouchableOpacity 
                    onPress={() => setCurrentPageIndex(prev => Math.min(prev + 1, lastPageIdx))} 
                    className="bg-surfaceBlack px-6 py-3 rounded-lg"
                    style={{ opacity: currentPageIndex === lastPageIdx ? 0.5 : 1 }}
                    disabled={currentPageIndex === lastPageIdx}
                >
                    <Text className="text-white">Next</Text>
                </TouchableOpacity>

                <Text className="text-white">{currentPageIndex + 1} / {pages.length}</Text>
            
                <TouchableOpacity 
                    onPress={() => setCurrentPageIndex(prev => Math.max(prev - 1, firstPageIdx))}
                    className="bg-surfaceBlack px-6 py-3 rounded-lg"
                    style={{ opacity: currentPageIndex === firstPageIdx ? 0.5 : 1 }}
                    disabled={currentPageIndex === firstPageIdx}    
                >
                    
                    <Text className="text-white">Back</Text>
                </TouchableOpacity>
            </View>
            
        </SafeAreaView>
    )
} 
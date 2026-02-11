import { getMockReadingData } from "@/types/mocks/mock_data";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderLandmark } from "./ReaderLandmark";
import { SurahSection } from "./SurahSection";


export const ReaderInfiniteScroll = () => {
    
    
    const [scrollProgress, setScrollProgress] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // If we have heights but the content doesn't exceed the screen
        if (contentHeight > 0 && scrollViewHeight > 0 && contentHeight <= scrollViewHeight) {
            setScrollProgress(100);
        }
    }, [contentHeight, scrollViewHeight]);

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

    const markers = segments.segments.map((segment, index) => ({
        type: 'surah' as const,
        position: (index / segments.segments.length) * 100,
        id: segment.surahId,
        name: `Surah ${segment.surahId}`
    }));

    const juzMarkers = [
        { type: 'juz' as const, position: 25, id: 1 },
        // { type: 'juz' as const, position: 50, id: 2 },
        // { type: 'juz' as const, position: 75, id: 3 },
    ]

    const allMarkers = [...markers, ...juzMarkers];

    const handleScroll = (event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        
        const scrollableHeight = contentSize.height - layoutMeasurement.height;
        
        if (scrollableHeight <= 0) {
            setScrollProgress(0);
            return;
        }

        const currentOffset = contentOffset.y;

        let progress = (currentOffset / scrollableHeight) * 100;
        if (progress <= 0) progress = 0;
        if (progress >= 100) progress = 100;
        // console.log(`Progress before clamping: ${progress}%`);

        setScrollProgress(progress);
    };

    return (
        <SafeAreaView className='bg-matteBlack h-full flex-row'>
            
            <Stack.Screen options={{ headerShown: false }} />


            <ReaderLandmark 
                markers={allMarkers}
                progress={scrollProgress}
                totalHeight={contentHeight} // Fallback to scrollViewHeight or default
            />
            
            <ScrollView 
                ref={scrollViewRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onLayout={(event) => {
                    setScrollViewHeight(event.nativeEvent.layout.height);
                }}
                onContentSizeChange={(width, height) => {
                    setContentHeight(height);
                }}
            >
                {segments.segments.map((item, index) => (
                    <SurahSection 
                    key={index}
                    segment={item} 
                    isLastSegment={index === segments.segments.length - 1} 
                    />
                ))}
            </ScrollView>

        </SafeAreaView>
    )

}

import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderLandmark } from "./ReaderLandmark";
import { SurahSection } from "./SurahSection";
import * as DB from "@/utils/DatabaseManager";
import { ReaderParams, SessionType } from "@/types/reader_data";
import { ReadingSession } from "@/types/quran_data";
import React from "react";



export const ReaderInfiniteScroll = () => {
    
    const [quranData, setQuranData] = useState<ReadingSession>();
    const [isLoading, setIsLoading] = useState(true);
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

    const raw_params = useLocalSearchParams();
    
    const params = {
        surahId: raw_params.surahId ? parseInt(raw_params.surahId as string, 10) : undefined,
        sessionType: raw_params.sessionType as SessionType || 'daily_werd'
    } as ReaderParams;


    useEffect(() => {
        const fetchData = async () => {
            try{
                const data = await DB.fetchQuranText(params) as ReadingSession;
                console.log("reading session data")
                setQuranData(data);
            } catch (error) {
                console.error("Error fetching Quran text:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [params.surahId, params.sessionType]);

    const segments = quranData?.segments || [];

    const markers = segments.map((segment, index) => ({
        type: 'surah' as const,
        position: (index / segments.length) * 100,
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
        <SafeAreaView className='bg-white dark:bg-matteBlack h-full flex-row'>
            
            <Stack.Screen options={{ headerShown: false }} />


            {!isLoading && (
                <ReaderLandmark 
                    markers={allMarkers}
                    progress={scrollProgress}
                    totalHeight={contentHeight}
                />
            )}
            
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size={30} color="#D4AF37" />
                </View>
            ) : (
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
                    {segments.map((item, index) => (
                        <SurahSection 
                            key={index}
                            segment={item} 
                            isLastSegment={index === segments.length - 1} 
                        />
                    ))}
                </ScrollView>
            )}

        </SafeAreaView>
    )

}

import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { ScrollView, View, ActivityIndicator, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderLandmark } from "./ReaderLandmark";
import { SurahSection } from "./SurahSection";
import * as DB from "@/utils/DatabaseManager";
import { SessionType } from "@/types/reader_data";
import { ReadingSession } from "@/types/quran_data";
import React from "react";

export const ReaderInfiniteScroll = () => {
    const [quranData, setQuranData] = useState<ReadingSession>();
    const [isLoading, setIsLoading] = useState(true);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    
    // Use standard Animated.Value for the landmark progress
    const scrollProgress = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);

    const raw_params = useLocalSearchParams();
    
    const params = useMemo(() => ({
        surahId: raw_params.surahId ? parseInt(raw_params.surahId as string, 10) : undefined,
        sessionType: (raw_params.sessionType as SessionType) || 'daily_werd'
    }), [raw_params.surahId, raw_params.sessionType]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true); 
            try {
                const data = await DB.fetchQuranText(params) as ReadingSession;
                setQuranData(data);
            } catch (error) {
                console.error("Error fetching Quran text:", error);
                setIsLoading(false); 
            }
        };
        fetchData();
    }, [params]);

    const segments = quranData?.segments || [];
    const markers = segments.map((segment, index) => ({
        type: 'surah' as const,
        position: (index / segments.length) * 100,
        id: segment.surahId,
        name: `Surah ${segment.surahId}`
    }));

    const allMarkers = [...markers, { type: 'juz' as const, position: 25, id: 1 }];

    // Standard Animated.event fix
    const handleScroll = (event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const scrollableHeight = contentSize.height - layoutMeasurement.height;
        
        if (scrollableHeight > 0) {
            const progress = (contentOffset.y / scrollableHeight) * 100;
            // setValue updates the Animated.Value directly without a re-render
            scrollProgress.setValue(Math.min(Math.max(progress, 0), 100));
        }
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
            
            <View className={`flex-1 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <ScrollView 
                    ref={scrollViewRef}
                    onScroll={handleScroll}
                    scrollEventThrottle={16} // Essential for smooth 60fps tracking
                    onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
                    onContentSizeChange={(width, height) => {
                        
                        setContentHeight(height);
                        if (height > 0 && scrollViewHeight > 0 && height <= scrollViewHeight + 1) {
                            scrollProgress.setValue(100);
                        }
                        if (height > 0) setIsLoading(false);
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
            </View>

            {isLoading && (
                <View className="absolute inset-0 justify-center items-center">
                    <ActivityIndicator size={30} color="#D4AF37" />
                </View>
            )}
        </SafeAreaView>
    );
};
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ScrollView, View, ActivityIndicator, Animated,TouchableOpacity,Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReaderLandmark } from "./ReaderLandmark";
import { SurahSection } from "./SurahSection";
import * as DB from "@/utils/DatabaseManager";
import { SessionType } from "@/types/reader_data";
import { ReadingSession } from "@/types/quran_data";
import { useStreak } from '@/services/StreakManager';
import React from "react";
import { useFocusEffect } from 'expo-router';


export const ReaderInfiniteScroll = () => {
    const [quranData, setQuranData] = useState<ReadingSession>();
    const [isLoading, setIsLoading] = useState(true);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const [surahPositions, setSurahPositions] = useState<Record<number, number>>({});
    // const [progressPercent, setProgressPercent] = useState(0);
    const { incrementStreak } = useStreak(); 

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

//     useFocusEffect(
//     useCallback(() => {
//         return () => {
//             const saveProgress = async () => {
//                 console.log(`progressPercent = ${progressPercent}`)
//                 const today = await DB.getLastStopped();
//                 const data = await DB.getDailyProgress(today!)
//                 if (today !== null) {
//                     await DB.updateDailyProgress({ scroll_percentage: Math.max(progressPercent, data!.scroll_percentage) }, today);
//                 }
//             };
//             saveProgress();
//         };
//     }, [progressPercent])
// );
const isCompletedRef = useRef(false);

useFocusEffect(
    useCallback(() => {
        isCompletedRef.current = false; // reset on enter
        return () => {
            const saveProgress = async () => {
                if (isCompletedRef.current) return; // skip if just completed
                const currentPercent = Math.round((scrollProgress as any)._value);
                console.log(`progressPercent = ${currentPercent}`);
                const today = await DB.getLastStopped();
                if (today !== null) {
                    const data = await DB.getDailyProgress(today);
                    const best = Math.max(currentPercent, data?.scroll_percentage ?? 0);
                    await DB.updateDailyProgress({ scroll_percentage: best }, today);
                }
            };
            saveProgress();
        };
    }, [])
);

    // useEffect(() => {
    //     const listener = scrollProgress.addListener(({ value }) => {
    //         setProgressPercent(Math.round(value)); // 0–100
    //     });
    //     return () => scrollProgress.removeListener(listener);
    // }, []);

const handleCompleted = async () => {
    try {
        await incrementStreak()
        const today = await DB.getLastStopped()
        await DB.updateDailyProgress({ is_completed: 1, scroll_percentage: 0 }, today!)
        isCompletedRef.current = true;
        console.log("Marked as completed")
    }
    catch (error) {
        console.log(error)
    }
}

    const segments = quranData?.segments || [];

    const markers = useMemo(() => {
        return segments.map((segment) => {
            const yPos = surahPositions[segment.surahId] || 0;
            // Calculate position as a percentage of total content height
            const position = contentHeight > 0 ? (yPos / contentHeight) * 100 : 0;

            return {
                type: 'surah' as const,
                position: position,
                id: segment.surahId,
                name: `Surah ${segment.surahId}`
            };
        });
    }, [segments, surahPositions, contentHeight]);      

    const allMarkers = [...markers];

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
                        <View 
                            key={index}
                            onLayout={(event) => {
                                const { y } = event.nativeEvent.layout;
                                setSurahPositions(prev => ({
                                    ...prev,
                                    [item.surahId]: y
                                }));
                            }}
                        >
                            <SurahSection 
                                segment={item} 
                                isLastSegment={index === segments.length - 1} 
                            />
                        </View>
                    ))}
                    {!isLoading && params.sessionType === 'daily_werd' && (
                        <View className="p-8 items-center justify-center">
                            <TouchableOpacity 
                                onPress={handleCompleted}
                                className="bg-hassibGreen px-10 py-4 rounded-full shadow-md"
                            >
                                <Text 
                                    className="text-white font-bold text-center"
                                    style = {{
                                        textShadowColor: 'rgba(0, 0, 0, 0.25)', // The color and opacity
                                        textShadowOffset: { width: 2, height: 2 }, // Direction (X, Y)
                                        textShadowRadius: 4, // The blurriness
                                    }}
                                >
                                    Mark Today's Werd as Complete
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
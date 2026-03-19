import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { FlatList, View, Text, useWindowDimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageAtom, ReadingSession } from "@/types/quran_data";
import { ReaderPageAtom } from "@/components/ReaderPageAtom";
import { segmentSessionIntoAtoms } from "@/utils/paginationMeasure";
import { PaginatedMeasurer } from "@/components/PaginatedMeasurer";
import * as DB from "@/utils/DatabaseManager";
import { ReaderParams, SessionType } from "@/types/reader_data";
import { useStreak } from '@/services/StreakManager';
import { useTranslation } from "react-i18next";
import React from "react";

export const ReaderPages = () => {
    const flatListRef = useRef<FlatList>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState<{ items: PageAtom[]; firstAyah: any }[]>([]);
    const [isMeasuring, setIsMeasuring] = useState(true);
    const [quranData, setQuranData] = useState<PageAtom[]>([]);
    const { height, width } = useWindowDimensions();
    const { incrementStreak } = useStreak(); 
    const isCompletedRef = useRef(false);
    const router = useRouter();
    const raw_params = useLocalSearchParams();
    const { t } = useTranslation();

    const surahId = raw_params.surahId ? parseInt(raw_params.surahId as string, 10) : undefined;
    const sessionType = (raw_params.sessionType as SessionType) || 'daily_werd';

    // IMPORTANT: Track the current verse in a Ref to avoid stale closures during exit
    const currentVerseRef = useRef<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = { surahId, sessionType } as ReaderParams;
                const data = await DB.fetchQuranText(params) as ReadingSession;
                setQuranData(segmentSessionIntoAtoms(data.segments));
            } catch (error) { console.error("Error fetching Quran text:", error); }
        }
        fetchData();
    }, [surahId, sessionType]);

    useEffect(() => {
    // Check if pages exist and the current page actually has data
    if (pages.length > 0 && pages[currentPage]?.firstAyah) {
        currentVerseRef.current = pages[currentPage].firstAyah;
        console.log("Current Verse Ref Updated:", currentVerseRef.current);
    }
}, [currentPage, pages]); // This now watches both index AND page generation

useFocusEffect(
    useCallback(() => {
        isCompletedRef.current = false;
        return () => {
            const saveProgress = async () => {
                // IMPORTANT: Check if we have a valid verse to save
                const verse = currentVerseRef.current;
                
                if (isCompletedRef.current || sessionType === 'full_surah' || !verse) {
                    console.log("Save skipped: completed, wrong session, or null verse.");
                    return;
                }

                const today = await DB.getLastStopped();
                if (today !== null) {
                    try {
                        await DB.updateDailyProgress({
                            exit_surah_id: verse.surahId, 
                            exit_verse_relative_id: verse.ayahNumber
                        }, today);
                        console.log("Successfully saved exit data:", verse);
                    } catch (err) {
                        console.error("Failed to save progress:", err);
                    }
                }
            };
            saveProgress();
        };
    }, [sessionType])
);

    const handleCompleted = async () => {
        await incrementStreak();
        const today = await DB.getLastStopped();
        await DB.updateDailyProgress({ is_completed: 1 }, today!);
        isCompletedRef.current = true;
        router.back();
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentPage(viewableItems[0].index || 0);
        }
    });

    return (
        <SafeAreaView className="bg-white dark:bg-matteBlack h-full">
            {isMeasuring && quranData.length > 0 && (
                <PaginatedMeasurer
                    allItems={quranData}
                    targetHeight={height * 0.85}
                    onPageGenerated={(page, last, firstAyah) => {
                        setPages(prev => [...prev, { items: page, firstAyah }]);
                        if (last) setIsMeasuring(false);
                    }}
                />
            )}
            <Stack.Screen options={{ headerShown: false }} />

            <FlatList
                ref={flatListRef}
                data={pages}
                renderItem={({ item }) => (
                    <View style={{ width, height: height * 0.85 }}>
                        <ReaderPageAtom items={item.items} />
                    </View>
                )}
                keyExtractor={(_, index) => `page-${index}`}
                horizontal pagingEnabled inverted
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            />

            {!isMeasuring && currentPage === pages.length - 1 && sessionType === 'daily_werd' && (
                <View className="p-8 items-center">
                    <TouchableOpacity onPress={handleCompleted} className="bg-hassibGreen py-4 px-8 rounded-full shadow-md">
                        <Text className="text-white font-bold">{t("markCompletedReader")}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View className="flex-row m-5 justify-between items-center p-4">
                <TouchableOpacity onPress={() => flatListRef.current?.scrollToIndex({ index: currentPage + 1 })}
                    className="bg-textDeep/15 dark:bg-surfaceBlack px-6 py-3 rounded-lg w-[37%] items-center"
                    disabled={currentPage === pages.length - 1} style={{ opacity: currentPage === pages.length - 1 ? 0.5 : 1 }}>
                    <Text className="dark:text-white">{t("next")}</Text>
                </TouchableOpacity>
                <Text className="dark:text-white">{pages.length > 0 ? `${currentPage + 1} / ${pages.length}` : '-'}</Text>
                <TouchableOpacity onPress={() => flatListRef.current?.scrollToIndex({ index: currentPage - 1 })}
                    className="bg-textDeep/15 dark:bg-surfaceBlack px-6 py-3 rounded-lg w-[37%] items-center"
                    disabled={currentPage === 0} style={{ opacity: currentPage === 0 ? 0.5 : 1 }}>
                    <Text className="dark:text-white">{t("previous")}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
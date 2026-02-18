import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { FlatList, View, Text, useWindowDimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageAtom, ReadingSession } from "@/types/quran_data";
import { ReaderPageAtom } from "@/components/ReaderPageAtom";
import { segmentSessionIntoAtoms } from "@/utils/paginationMeasure";
import { PaginatedMeasurer } from "@/components/PaginatedMeasurer";
import * as DB from "@/utils/DatabaseManager";
import { ReaderParams, SessionType } from "@/types/reader_data";
import { useStreak } from '@/services/StreakManager';
import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export const ReaderPages = () => {
    const flatListRef = useRef<FlatList>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const currentPageRef = useRef(0);
    const [pages, setPages] = useState<{ items: PageAtom[] }[]>([]);
    const [isMeasuring, setIsMeasuring] = useState(true);
    const [quranData, setQuranData] = useState<PageAtom[]>([]);
    const { height, width } = useWindowDimensions();
    const { incrementStreak } = useStreak(); 
    const isCompletedRef = useRef(false);
    const router = useRouter();
    const raw_params = useLocalSearchParams();
    const surahId = raw_params.surahId ? parseInt(raw_params.surahId as string, 10) : undefined;
    const sessionType = (raw_params.sessionType as SessionType) || 'daily_werd';
        const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = { surahId, sessionType } as ReaderParams;
                const data = await DB.fetchQuranText(params) as ReadingSession;
                setQuranData(segmentSessionIntoAtoms(data.segments));
            } catch (error) {
                console.error("Error fetching Quran text:", error);
            }
        }
        fetchData();
    }, [surahId, sessionType]);

useFocusEffect(
    useCallback(() => {
        isCompletedRef.current = false;
        return () => {
            const saveProgress = async () => {
                if (isCompletedRef.current) return;
                if (sessionType === 'full_surah') return;
                const today = await DB.getLastStopped();
                if (today !== null) {
                    const data = await DB.getDailyProgress(today);
                    const best = Math.max(currentPageRef.current, data?.last_page ?? 0);
                    await DB.updateDailyProgress({ last_page: best }, today);
                    console.log(`Saved last_page = ${currentPageRef.current}`);
                }
            };
            saveProgress();
        };
    }, [])
);

    const goToPage = (pageIndex: number) => {
        if (!pages || pages.length === 0) return;
        if (pageIndex < 0 || pageIndex >= pages.length) return;

        flatListRef.current?.scrollToIndex({
            index: pageIndex,
            animated: true,
        });
    };

const handleCompleted = async () => {
    try {
        await incrementStreak()
        const today = await DB.getLastStopped()
        await DB.updateDailyProgress({ is_completed: 1, last_page: 0 }, today!)
        isCompletedRef.current = true;
        console.log("Marked as completed")
        router.back();
    }
    catch (error) {
        console.log(error)
    }
}

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index || 0;
            setCurrentPage(index);
            currentPageRef.current = index;
        }
    });

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    });

    const renderPage = ({ item }: { item: { items: PageAtom[] } }) => {
        return (
            <View style={{ width, height: height * 0.85 }}>
                <ReaderPageAtom items={item.items} />
            </View>
        );
    };
    
    const isLastPage = currentPage === pages.length - 1; 

    return (
        <SafeAreaView className="bg-white dark:bg-matteBlack h-full">
            {isMeasuring && quranData.length > 0 && (
                <PaginatedMeasurer
                    allItems={quranData || []}
                    targetHeight={height * 0.85}
                    onPageGenerated={(page: PageAtom[], last: boolean) => {
                        setPages(prev => [...prev, { items: page }]);
                        if (last) setIsMeasuring(false);
                    }}
                />
            )}
            <Stack.Screen options={{ headerShown: false }} />

            <FlatList
                ref={flatListRef}
                data={pages}
                renderItem={renderPage}
                keyExtractor={(_, index) => `page-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
                inverted
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />
            {!isMeasuring && isLastPage && sessionType === 'daily_werd' && (
                <View className="p-8 items-center justify-center">
                    <TouchableOpacity 
                        onPress={handleCompleted}
                        className="bg-hassibGreen py-4 px-8 rounded-full shadow-md"
                    >
                        <Text 
                            className="text-white font-bold text-center"
                            style={{
                                textShadowColor: 'rgba(0, 0, 0, 0.25)',
                                textShadowOffset: { width: 2, height: 2 },
                                textShadowRadius: 4,
                            }}
                        >
                            {t("markCompletedReader")}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <View className="flex-row m-5 justify-between items-center p-4">
                <TouchableOpacity
                    onPress={() => goToPage(currentPage + 1)}
                    className="bg-textDeep/15 dark:bg-surfaceBlack px-6 py-3 rounded-lg w-[37%] items-center"
                    style={{ opacity: currentPage === pages.length - 1 ? 0.5 : 1 }}
                    disabled={currentPage === pages.length - 1}
                >
                    <Text className="text-matteBlack dark:text-white">{t("next")}</Text>
                </TouchableOpacity>

                <View className="items-center">
                    {isMeasuring ? (
                        <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                        <Text className="text-matteBlack dark:text-white">
                            {Math.min(currentPage + 1, pages.length)} / {pages.length}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => goToPage(currentPage - 1)}
                    className="bg-textDeep/15 dark:bg-surfaceBlack px-6 py-3 rounded-lg w-[37%] items-center"
                    style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                    disabled={currentPage === 0}
                >
                    <Text className="text-matteBlack dark:text-white">{t("previous")}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
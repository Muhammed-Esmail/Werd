import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect } from "react";
import { FlatList, View, Text, useWindowDimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageAtom, ReadingSession } from "@/types/quran_data";
import { ReaderPageAtom } from "@/components/ReaderPageAtom";
import { segmentSessionIntoAtoms } from "@/utils/paginationMeasure";
import { PaginatedMeasurer } from "@/components/PaginatedMeasurer";
import * as DB from "@/utils/DatabaseManager";
import { ReaderParams, SessionType } from "@/types/reader_data";
import { ActivityIndicator } from 'react-native';
import React from "react";


export const ReaderPages = () => {
    const flatListRef = useRef<FlatList>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState<{ items: PageAtom[] }[]>([]);
    const [isMeasuring, setIsMeasuring] = useState(true);
    const [quranData, setQuranData] = useState<PageAtom[]>([]);
    const { height, width } = useWindowDimensions();

    // Data
    const raw_params = useLocalSearchParams();

    const surahId = raw_params.surahId ? parseInt(raw_params.surahId as string, 10) : undefined;
    const sessionType = (raw_params.sessionType as SessionType) || 'daily_werd';



    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = {
                    surahId,
                    sessionType
                } as ReaderParams;
                const data = await DB.fetchQuranText(params) as ReadingSession;
                console.log("reading session data")
                setQuranData(segmentSessionIntoAtoms(data.segments));
            } catch (error) {
                console.error("Error fetching Quran text:", error);
            }
        }
        fetchData();
    }, [surahId, sessionType]);


    // Scroll to specific page
    const goToPage = (pageIndex: number) => {
        if (!pages || pages.length === 0) {
            console.warn("Cannot go to page: No pages loaded");
            return;
        }

        if (pageIndex < 0 || pageIndex >= pages.length) {
            console.warn(`Invalid page index: ${pageIndex}. Max is ${pages.length - 1}`);
            return;
        }

        flatListRef.current?.scrollToIndex({
            index: pageIndex,
            animated: true,
        });
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentPage(viewableItems[0].index || 0);
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

    // to check if there is something going wrong with the pages
    if (!pages || pages.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-black">
                <Text className="text-black dark:text-white">Loading Quran...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="bg-matteBlack h-full">
            {isMeasuring && quranData.length > 0 && (
                <PaginatedMeasurer
                    allItems={quranData || []} // @ts-ignore
                    targetHeight={height * 0.85}
                    onPageGenerated={(page: PageAtom[], last: boolean) => {
                        setPages(prev => [...prev, { items: page }]);
                        if (last) setIsMeasuring(false);
                        console.log('Generated page with', page.length, 'atoms. Last?', last);
                    }}
                />
            )
            }
            <Stack.Screen options={{ headerShown: false }} />

            <FlatList
                ref={flatListRef}
                data={pages}
                renderItem={renderPage}
                keyExtractor={(item, index) => `page-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
                inverted
                getItemLayout={(data, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* Page Controls */}
            <View className="flex-row m-5 justify-between items-center p-4">

                <TouchableOpacity
                    onPress={() => goToPage(currentPage + 1)}
                    className="bg-surfaceBlack px-6 py-3 rounded-lg w-[37%] items-center"
                    style={{ opacity: currentPage === pages.length - 1 ? 0.5 : 1 }}
                    disabled={currentPage === pages.length - 1}
                >
                    <Text className="text-white">Next</Text>
                </TouchableOpacity>

                {isMeasuring && (
                    <View className="flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="#FFD700" />
                    </View>
                )}

                <Text className="text-white">
                    {Math.min(currentPage + 1, pages.length)} / {pages.length}
                </Text>

                <TouchableOpacity
                    onPress={() => goToPage(currentPage - 1)}
                    className="bg-surfaceBlack px-6 py-3 rounded-lg w-[37%] items-center"
                    style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                    disabled={currentPage === 0}
                >
                    <Text className="text-white">Previous</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
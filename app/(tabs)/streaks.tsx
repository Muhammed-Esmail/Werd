import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, ViewToken, ListRenderItem, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreak, MonthData } from '@/services/StreakManager';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from "nativewind";

const { width } = Dimensions.get('window');
const MAX_GRID_WIDTH = 360;
const LIST_WIDTH = Math.min(width - 88, MAX_GRID_WIDTH);

// If RTL, we flip the FlatList container with scaleX(-1) to force LTR scroll order,
// then flip each item back with scaleX(-1) so content appears correctly.
const IS_RTL = I18nManager.isRTL;

const DaySquare = React.memo(({ intensity, colorScheme }: { intensity: number, colorScheme: string | undefined }) => (
    <View className="w-[13.5%] aspect-square mb-1.5">
        <View
            className="flex-1 rounded-md border border-gray-200/20 dark:border-white/5"
            style={{
                backgroundColor: intensity > 0 ? '#eab308' : (colorScheme === 'dark' ? '#18181b' : '#e5e7eb'),
                shadowColor: intensity > 0 ? '#eab308' : 'transparent',
                shadowOpacity: intensity > 0 ? 0.2 : 0,
                shadowRadius: 4
            }}
        />
    </View>
), (prev, next) => prev.intensity === next.intensity && prev.colorScheme === next.colorScheme);

const MonthItem = React.memo(({ item, colorScheme }: { item: MonthData, colorScheme: string | undefined }) => (
    // scaleX(-1) flips this item back to normal when the parent FlatList is flipped
    <View style={{ width: LIST_WIDTH, transform: [{ scaleX: IS_RTL ? -1 : 1 }] }} className="items-center">
        <Text className="text-zinc-500 dark:text-zinc-500 text-[10px] font-bold mb-4 tracking-widest uppercase">
            {item.label}
        </Text>
        {/* Force LTR layout for day grid so days always flow left-to-right */}
        <View
            className="flex-row flex-wrap justify-between w-full"
            style={{ direction: 'ltr' }}
        >
            {item.days.map((day, index) => (
                <DaySquare key={index} intensity={day.intensity} colorScheme={colorScheme} />
            ))}
            {[...Array(7)].map((_, i) => <View key={`filler-${i}`} className="w-[13.5%]" />)}
        </View>
    </View>
));

const StreakPage = () => {
    const { colorScheme } = useColorScheme();
    const { t } = useTranslation();
    const { streak, longest, loading, heatmapData } = useStreak();
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (heatmapData.length > 0) {
            setCurrentMonthIndex(heatmapData.length - 1);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: heatmapData.length - 1, animated: false });
            }, 100);
        }
    }, [heatmapData.length]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentMonthIndex(viewableItems[0].index);
        }
    }).current;

    const scrollToIndex = (index: number) => {
        if (index >= 0 && index < heatmapData.length) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
        }
    };

    const renderMonth: ListRenderItem<MonthData> = useCallback(({ item }) => (
        <MonthItem item={item} colorScheme={colorScheme} />
    ), [colorScheme]);

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] justify-center items-center">
                <ActivityIndicator size="large" color="#eab308" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#0a0a0a]">
            <ScrollView className="flex-1 px-5">

                {/* Header */}
                <View className='w-[100%] justify-center items-center mb-10'>
                    <Text className='text-primaryGold mt-10 text-xl font-bold'> {t('streaks')} </Text>
                </View>

                {/* Cards */}
                <View className="flex-row gap-4 mb-6">
                    <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200 dark:border-zinc-800 items-center justify-center">
                        <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 text-center">{t('currentStreak')}</Text>
                        <View className="flex-row items-center justify-center">
                            <Text className="text-4xl font-bold text-yellow-500 mr-2">{streak}</Text>
                            <Text className="text-xl">🔥</Text>
                        </View>
                        <Text className="text-gray-600 dark:text-zinc-400 text-[10px] mt-1 text-center">{t('daysConsistent')}</Text>
                    </View>

                    <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200 dark:border-zinc-800 items-center justify-center">
                        <Text className="text-gray-500 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 text-center">{t('longestStreak')}</Text>
                        <Text className="text-4xl font-bold text-gray-900 dark:text-zinc-200 text-center">{longest}</Text>
                        <Text className="text-yellow-600/70 text-[10px] font-medium mt-1 text-center">{t('days')}</Text>
                    </View>
                </View>

                {/* Heatmap Section */}
                <View className="bg-white dark:bg-zinc-900/50 pt-6 pb-6 rounded-[32px] border border-gray-200 dark:border-zinc-800/50 mb-8 items-center w-full">
                    <View style={{ width: LIST_WIDTH + 10 }} className="flex-row justify-between items-center mb-2">
                        {/* Left arrow always goes to previous month (lower index) */}
                        <TouchableOpacity
                            onPress={() => scrollToIndex(currentMonthIndex - 1)}
                            disabled={currentMonthIndex === 0}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text className={`text-2xl ${currentMonthIndex === 0 ? 'text-gray-300 dark:text-zinc-700' : 'text-yellow-500'}`}>‹</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-900 dark:text-zinc-100 font-bold text-lg">{t('activityHistory')}</Text>
                        {/* Right arrow always goes to next month (higher index) */}
                        <TouchableOpacity
                            onPress={() => scrollToIndex(currentMonthIndex + 1)}
                            disabled={currentMonthIndex === heatmapData.length - 1}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text className={`text-2xl ${currentMonthIndex === heatmapData.length - 1 ? 'text-gray-300 dark:text-zinc-700' : 'text-yellow-500'}`}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* scaleX(-1) on the FlatList container forces LTR scroll order in RTL mode.
                        Each MonthItem also has scaleX(-1) to cancel out the flip on content. */}
                    <View style={{ transform: [{ scaleX: IS_RTL ? -1 : 1 }] }}>
                        <FlatList
                            ref={flatListRef}
                            data={heatmapData}
                            keyExtractor={(item) => item.id}
                            horizontal
                            pagingEnabled
                            removeClippedSubviews={false}
                            initialNumToRender={6}
                            maxToRenderPerBatch={6}
                            windowSize={5}
                            showsHorizontalScrollIndicator={false}
                            style={{ width: LIST_WIDTH, flexGrow: 0 }}
                            snapToInterval={LIST_WIDTH}
                            decelerationRate="fast"
                            getItemLayout={(_, index) => ({ length: LIST_WIDTH, offset: LIST_WIDTH * index, index })}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                            renderItem={renderMonth}
                        />
                    </View>
                </View>

                {/* Quote Section */}
                <View className="bg-white dark:bg-zinc-900/30 border border-gray-200 dark:border-zinc-800/50 p-8 rounded-[40px] items-center relative overflow-hidden">
                    <Text className="text-yellow-500 text-4xl mb-2">"</Text>
                    <Text className="text-gray-900 dark:text-zinc-200 text-center text-lg leading-7 font-medium italic px-2">
                        {t('prophetQuote')}
                    </Text>
                    <View className="flex-row items-center mt-6">
                        <View className="h-[1px] w-8 bg-gray-300 dark:bg-zinc-700" />
                        <Text className="text-yellow-500 font-bold tracking-widest text-[10px] mx-3">{t('prophetMuhammad')}</Text>
                        <View className="h-[1px] w-8 bg-gray-300 dark:bg-zinc-700" />
                    </View>
                </View>

                <Text className="text-gray-400 dark:text-zinc-600 text-center mt-8 mb-10 tracking-[4px] text-[10px] font-bold">
                    {t('mashaallah')}
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
};

export default StreakPage;
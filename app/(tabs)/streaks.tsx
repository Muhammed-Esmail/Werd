import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, ViewToken, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreak } from '@/services/StreakManager';
import { useTranslation } from 'react-i18next';

interface DayData {
  intensity: number;
}

interface MonthData {
  id: string;
  label: string;
  days: DayData[];
}

const { width } = Dimensions.get('window');

const MAX_GRID_WIDTH = 360; 
const LIST_WIDTH = Math.min(width - 88, MAX_GRID_WIDTH);

const generateMockMonths = (t: any): MonthData[] => {
  const months: MonthData[] = [];
  const today = new Date();
  const MONTH_NAMES = [
    t('jan'), t('feb'), t('mar'), t('apr'), 
    t('may'), t('jun'), t('jul'), t('aug'), 
    t('sep'), t('oct'), t('nov'), t('dec')
  ];
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    const daysInMonth = new Date(year, d.getMonth() + 1, 0).getDate();
    
    const days: DayData[] = Array.from({ length: daysInMonth }, () => ({
      intensity: Math.random() > 0.4 ?  1 : 0, 
    }));

    months.push({ id: `${monthName}-${year}`, label: `${monthName} ${year}`, days });
  }
  return months.reverse(); 
};

const StreakPage = () => {
  const { t } = useTranslation();
  const { streak, incrementStreak, longest, loading } = useStreak();
  const MOCK_MONTHS = React.useMemo(() => generateMockMonths(t), [t]);
  const longestStreak = longest; 
  const [currentMonthIndex, setCurrentMonthIndex] = useState(MOCK_MONTHS.length - 1);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentMonthIndex(viewableItems[0].index);
    }
  }).current;

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < MOCK_MONTHS.length) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const renderMonth: ListRenderItem<MonthData> = ({ item }) => (
    <View style={{ width: LIST_WIDTH }} className="items-center">
      <Text className="text-zinc-500 dark:text-zinc-500 text-[10px] font-bold mb-4 tracking-widest uppercase">
        {item.label}
      </Text>

      <View className="flex-row flex-wrap justify-between w-full">
        {item.days.map((day: DayData, index: number) => (
          <View 
            key={index} 
            className="w-[13.5%] aspect-square mb-1.5"
          >
            <View 
              className="flex-1 rounded-md border border-gray-200/20 dark:border-white/5"
              style={{ 
                backgroundColor: day.intensity === 0 ? '#f4f4f5' : '#eab308' 
              }}
            />
          </View>
        ))}
        {[...Array(7)].map((_, i) => <View key={`filler-${i}`} className="w-[13.5%]" />)}
      </View>
    </View>
  );

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
        
        <View className='w-[100%] justify-center items-center mb-10'>
          <Text className='text-primaryGold mt-10 text-xl font-bold'> {t('streaks')} </Text>
        </View>

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
            <Text className="text-4xl font-bold text-gray-900 dark:text-zinc-200 text-center">{longestStreak}</Text>
            <Text className="text-yellow-600/70 text-[10px] font-medium mt-1 text-center">{t('days')}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => incrementStreak()}
          activeOpacity={0.3}
          className="bg-yellow-500 py-4 rounded-2xl mb-8 items-center justify-center shadow-lg shadow-yellow-500/20"
        >
          <View className="flex-row items-center">
            <Text className="text-black font-bold text-base mr-2">{t('testIncrementStreak')}</Text>
            <Text>⚡</Text>
          </View>
        </TouchableOpacity>

        <View className="bg-white dark:bg-zinc-900/50 pt-6 pb-6 rounded-[32px] border border-gray-200 dark:border-zinc-800/50 mb-8 items-center w-full">
          
          <View 
            style={{ width: LIST_WIDTH + 10 }}
            className="flex-row justify-between items-center mb-2"
          >
            <TouchableOpacity 
              onPress={() => scrollToIndex(currentMonthIndex - 1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`text-2xl ${currentMonthIndex === 0 ? 'text-gray-300 dark:text-zinc-700' : 'text-yellow-500'}`}>‹</Text>
            </TouchableOpacity>
            
            <Text className="text-gray-900 dark:text-zinc-100 font-bold text-lg">{t('activityHistory')}</Text>
            
            <TouchableOpacity 
              onPress={() => scrollToIndex(currentMonthIndex + 1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`text-2xl ${currentMonthIndex === MOCK_MONTHS.length - 1 ? 'text-gray-300 dark:text-zinc-700' : 'text-yellow-500'}`}>›</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            ref={flatListRef}
            data={MOCK_MONTHS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width: LIST_WIDTH, flexGrow: 0 }}
            snapToInterval={LIST_WIDTH}
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: LIST_WIDTH,
              offset: LIST_WIDTH * index,
              index,
            })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            initialScrollIndex={MOCK_MONTHS.length - 1}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            renderItem={renderMonth}
          />
        </View>

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
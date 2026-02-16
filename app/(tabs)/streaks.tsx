import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, ViewToken, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreak } from '@/services/StreakManager';

// --- Types ---
interface DayData {
  intensity: number;
}

interface MonthData {
  id: string;
  label: string;
  days: DayData[];
}

// --- Constants ---
const { width } = Dimensions.get('window');

const MAX_GRID_WIDTH = 360; 
const LIST_WIDTH = Math.min(width - 88, MAX_GRID_WIDTH);

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// --- Helpers ---
const generateMockMonths = (): MonthData[] => {
  const months: MonthData[] = [];
  const today = new Date();
  
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

const MOCK_MONTHS = generateMockMonths();

const StreakPage = () => {
  const { streak, incrementStreak, longest, loading } = useStreak(); 
  const longestStreak = longest; 
  const [currentMonthIndex, setCurrentMonthIndex] = useState(MOCK_MONTHS.length - 1);
  const flatListRef = useRef<FlatList>(null);

  // --- Handlers ---
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

  // --- Render Item (Consolidated) ---
  const renderMonth: ListRenderItem<MonthData> = ({ item }) => (
    <View style={{ width: LIST_WIDTH }} className="items-center">
      <Text className="text-zinc-500 text-[10px] font-bold mb-4 tracking-widest uppercase">
        {item.label}
      </Text>

      {/* Grid Container */}
      <View className="flex-row flex-wrap justify-between w-full">
        {item.days.map((day: DayData, index: number) => (
          <View 
            key={index} 
            className="w-[13.5%] aspect-square mb-1.5"
          >
            <View 
              className="flex-1 rounded-md border border-white/5"
              style={{ 
                backgroundColor: day.intensity === 0 ? '#18181b' : '#eab308' 
              }}
            />
          </View>
        ))}
        {/* Filler views to align the last row left when using justify-between */}
        {[...Array(7)].map((_, i) => <View key={`filler-${i}`} className="w-[13.5%]" />)}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
        <ActivityIndicator size="large" color="#eab308" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <ScrollView className="flex-1 px-5">
        
        {/* Header */}
        <View className='w-[100%] justify-center items-center mb-10'>
          <Text className='text-primaryGold mt-10 text-xl font-bold'> STREAKS </Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-zinc-900 p-5 rounded-3xl border border-zinc-800 items-center justify-center">
            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 text-center">Current Streak</Text>
            <View className="flex-row items-center justify-center">
              <Text className="text-4xl font-bold text-yellow-500 mr-2">{streak}</Text>
              <Text className="text-xl">🔥</Text>
            </View>
            <Text className="text-zinc-400 text-[10px] mt-1 text-center">DAYS CONSISTENT</Text>
          </View>

          <View className="flex-1 bg-zinc-900 p-5 rounded-3xl border border-zinc-800 items-center justify-center">
            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 text-center">Longest Streak</Text>
            <Text className="text-4xl font-bold text-zinc-200 text-center">{longestStreak}</Text>
            <Text className="text-yellow-600/70 text-[10px] font-medium mt-1 text-center">DAYS</Text>
          </View>
        </View>

        {/* --- TEST BUTTON --- */}
        <TouchableOpacity 
          onPress={() => incrementStreak()}
          activeOpacity={0.3}
          className="bg-yellow-500 py-4 rounded-2xl mb-8 items-center justify-center shadow-lg shadow-yellow-500/20"
        >
          <View className="flex-row items-center">
            <Text className="text-black font-bold text-base mr-2">Test: Increment Streak</Text>
            <Text>⚡</Text>
          </View>
        </TouchableOpacity>

        {/* Swipeable Heatmap Section */}
        <View className="bg-zinc-900/50 pt-6 pb-6 rounded-[32px] border border-zinc-800/50 mb-8 items-center w-full">
          
          {/* Arrows Header */}
          {/* UPDATE: Added explicit width to match LIST_WIDTH so arrows stay close to grid on tablets */}
          <View 
            style={{ width: LIST_WIDTH + 10 }} // +10 gives the arrows a little breathing room
            className="flex-row justify-between items-center mb-2"
          >
            <TouchableOpacity 
              onPress={() => scrollToIndex(currentMonthIndex - 1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`text-2xl ${currentMonthIndex === 0 ? 'text-zinc-700' : 'text-yellow-500'}`}>‹</Text>
            </TouchableOpacity>
            
            <Text className="text-zinc-100 font-bold text-lg">Activity History</Text>
            
            <TouchableOpacity 
              onPress={() => scrollToIndex(currentMonthIndex + 1)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`text-2xl ${currentMonthIndex === MOCK_MONTHS.length - 1 ? 'text-zinc-700' : 'text-yellow-500'}`}>›</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            ref={flatListRef}
            data={MOCK_MONTHS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            
            // Constrain width here
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

        {/* Quote Section */}
        <View className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[40px] items-center relative overflow-hidden">
          <Text className="text-yellow-500 text-4xl mb-2">“</Text>
          <Text className="text-zinc-200 text-center text-lg leading-7 font-medium italic px-2">
            "The most beloved of deeds to Allah are those that are most consistent, even if they are small."
          </Text>
          <View className="flex-row items-center mt-6">
            <View className="h-[1px] w-8 bg-zinc-700" />
            <Text className="text-yellow-500 font-bold tracking-widest text-[10px] mx-3">PROPHET MUHAMMAD (ﷺ)</Text>
            <View className="h-[1px] w-8 bg-zinc-700" />
          </View>
        </View>

        <Text className="text-zinc-600 text-center mt-8 mb-10 tracking-[4px] text-[10px] font-bold">
          MASHAALLAH • KEEP GOING
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

export default StreakPage;
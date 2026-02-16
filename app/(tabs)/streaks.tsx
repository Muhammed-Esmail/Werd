import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, ViewToken, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreak, MonthData, DayData } from '@/services/StreakManager'; // Import types from hook

// --- Constants ---
const { width } = Dimensions.get('window');
const MAX_GRID_WIDTH = 360; 
const LIST_WIDTH = Math.min(width - 88, MAX_GRID_WIDTH);

const StreakPage = () => {
  // Destructure heatmapData from the hook
  const { streak, incrementStreak, longest, loading, heatmapData } = useStreak(); 
  
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Scroll to the last month (current month) once data is loaded
  useEffect(() => {
    if (heatmapData.length > 0) {
        // Set initial index to the last item (current month)
        setCurrentMonthIndex(heatmapData.length - 1);
        
        // Optional: slight delay to ensure layout is ready before scrolling
        setTimeout(() => {
             flatListRef.current?.scrollToIndex({ index: heatmapData.length - 1, animated: false });
        }, 100);
    }
  }, [heatmapData.length]);

  // --- Handlers ---
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

  // --- Render Item ---
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
                // Using conditional logic based on intensity
                backgroundColor: day.intensity > 0 ? '#eab308' : '#18181b',
                // Optional: Add a subtle glow for active days
                shadowColor: day.intensity > 0 ? '#eab308' : 'transparent',
                shadowOpacity: day.intensity > 0 ? 0.2 : 0,
                shadowRadius: 4
              }}
            />
          </View>
        ))}
        {/* Filler views for alignment */}
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
            <Text className="text-4xl font-bold text-zinc-200 text-center">{longest}</Text>
            <Text className="text-yellow-600/70 text-[10px] font-medium mt-1 text-center">DAYS</Text>
          </View>
        </View>

        {/* --- ACTION BUTTON --- */}
        <TouchableOpacity 
          onPress={() => incrementStreak()}
          activeOpacity={0.3}
          className="bg-yellow-500 py-4 rounded-2xl mb-8 items-center justify-center shadow-lg shadow-yellow-500/20"
        >
          <View className="flex-row items-center">
            <Text className="text-black font-bold text-base mr-2">I Did It Today</Text>
            <Text>⚡</Text>
          </View>
        </TouchableOpacity>

        {/* Swipeable Heatmap Section */}
        <View className="bg-zinc-900/50 pt-6 pb-6 rounded-[32px] border border-zinc-800/50 mb-8 items-center w-full">
          
          {/* Navigation Arrows */}
          <View 
            style={{ width: LIST_WIDTH + 10 }} 
            className="flex-row justify-between items-center mb-2"
          >
            <TouchableOpacity 
              onPress={() => scrollToIndex(currentMonthIndex - 1)}
              disabled={currentMonthIndex === 0}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`text-2xl ${currentMonthIndex === 0 ? 'text-zinc-800' : 'text-yellow-500'}`}>‹</Text>
            </TouchableOpacity>
            
            <Text className="text-zinc-100 font-bold text-lg">Activity History</Text>
            
            <TouchableOpacity 
              onPress={() => scrollToIndex(currentMonthIndex + 1)}
              disabled={currentMonthIndex === heatmapData.length - 1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`text-2xl ${currentMonthIndex === heatmapData.length - 1 ? 'text-zinc-800' : 'text-yellow-500'}`}>›</Text>
            </TouchableOpacity>
          </View>
          
          {/* Real Data FlatList */}
          <FlatList
            ref={flatListRef}
            data={heatmapData} // Using real data
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
            // Initial scroll is handled by useEffect to avoid layout errors
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
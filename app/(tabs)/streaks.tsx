import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreak } from '@/services/StreakManager';

const StreakPage = () => {
  const { streak, incrementStreak, loading } = useStreak();

  // If the hook is still reading from AsyncStorage, show a loader
  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center items-center px-6">
        
        {/* Streak Display Card */}
        <View className="bg-white w-full max-w-sm p-8 rounded-[40px] items-center shadow-2xl shadow-slate-200 border border-slate-100">
          
          <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
            Current Progress
          </Text>

          {/* The "Flame" Container */}
          <View className="relative mb-6">
             {/* Simple decorative ring */}
            <View className="w-44 h-44 rounded-full border-4 border-orange-50 border-t-orange-500 rotate-45 justify-center items-center">
               <View className="-rotate-45 items-center">
                  <Text className="text-7xl font-black text-slate-800">
                    {streak}
                  </Text>
                  <Text className="text-orange-500 font-bold text-sm">
                    {streak === 1 ? 'DAY' : 'DAYS'}
                  </Text>
               </View>
            </View>
            
            {/* Small Floating Icon */}
            <View className="absolute -top-2 -right-2 bg-orange-500 w-12 h-12 rounded-full items-center justify-center border-4 border-white">
              <Text className="text-xl">🔥</Text>
            </View>
          </View>

          <View className="items-center mb-8">
            <Text className="text-slate-800 text-2xl font-bold text-center">
              {streak > 0 ? "You're on fire!" : "Start your journey!"}
            </Text>
            <Text className="text-slate-400 text-center mt-2 px-4">
              {streak > 0 
                ? "Don't let the flame go out. Complete your task today!" 
                : "Log your first activity to start a new streak."}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            onPress={incrementStreak}
            activeOpacity={0.8}
            className="w-full bg-orange-500 py-5 rounded-3xl shadow-lg shadow-orange-300 active:bg-orange-600"
          >
            <Text className="text-white text-center text-lg font-heavy tracking-wide">
               COMPLETE TASK
            </Text>
          </TouchableOpacity>

        </View>

        {/* Footer Info */}
        <Text className="mt-10 text-slate-400 font-medium italic">
          "Consistency is the key to success."
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default StreakPage;
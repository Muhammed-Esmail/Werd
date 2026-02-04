import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Card = ({sideIcon, sideText, mainText, underText}: any) =>{
  return  (
      <View className='flex-1 gap-2 bg-surfaceBlack border border-borderDark rounded-lg p-4 ml-4 mr-4'>
        {/* Icon + Side Text */}
        <View className='flex-row gap-3 items-center'>
          <MaterialIcons name={sideIcon} size={20} color={'#D4AF37'}/>
          <Text className='text-mutedWhite'>{sideText}</Text>
        </View>
        {/* Main Text */}
        <View className='flex-row gap-3 items-center justify-center'>
          <Text className='text-white text-xl font-bold'>{mainText}</Text>
        </View>
        {/* Under Text */}
        <View className='flex-row gap-3 items-center justify-center'>
          <Text className='text-light-300 text-m'>{underText}</Text>
        </View>      
      </View>
  )
}

const TodayCard = () => {
  
  const onReadTodaysWerd = () => {

  }

  const onCompleteManually = () => {
    
  }

  return (
    <View className='bg-white border-[2px] border-light-300 rounded-[20px]'>
      {/* Surah Name + Pages + Icon */}
      
      <View className='flex-row justify-between mt-3 '>
        {/* Surah Name + Pages */}
        <View className='gap-2 mt-5 ml-5'>
          <Text className='font-bold text-[25px]'>Al-Baqarah</Text>
          <Text className='text-mutedWhite'>Pages 10-25</Text>
        </View>
        <View className='border-[2px] border-primaryGold rounded-[20px] bg-goldGlow p-4 justify-center items-center mr-5 mt-4' >
          <MaterialIcons name='menu-book' size={35} color={'#D4AF37'}/>
        </View>        
      </View>
      {/* Progress bar */}
      
      <View className='mt-6 ml-5 mr-5 mb-3'>
        <View className='flex-row justify-between items-center'>
          <Text className='text-xs font-bold text-white'>CURRENT PROGRESS</Text>
          <Text className='text-primaryGold font-semibold'>6/15 pages</Text>
        </View>     
        <View className='bg-borderDark h-2.5 rounded-full overflow-hidden mt-2'>
          <LinearGradient
            // Colors from your palette: primaryGold to goldLight
            colors={['#D4AF37', '#F1E5AC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '40%', height: '100%', borderRadius: 999 }}
          />
        </View>
      </View>
      {/* Read Button */}
      <TouchableOpacity
        onPress={onReadTodaysWerd}
        activeOpacity={0.7}
        className='mt-5 h-20 p-4 bg-goldLight rounded-2xl w-[80%] items-center justify-center self-center'
      >
        <View className='items-center justify-center'>
          <Text className='font-bold tracking-wide text-[17px]'>Read Today's Werd</Text>
        </View>
      </TouchableOpacity>
      {/* Manual Completion */}
      <TouchableOpacity
        onPress={onCompleteManually}
        activeOpacity={0.7}
        className='mt-5 h-15 p-4 bg-mutedWhite border-[1px] border-light-300 rounded-2xl w-[80%] items-center justify-center self-center mb-7'
      >
        <View className='items-center justify-center'>
          <Text className='font-bold tracking-wide text-[15px]'>Mark as Completed Manually</Text>
        </View>
      </TouchableOpacity>

    </View>
  )
}

const werd = () => {
  return (
    <SafeAreaView className="flex-1 bg-matteBlack">
      
      {/* Header Container */}
      <View className='w-[100%] justify-center items-center'>
        <Text className='text-primaryGold mt-10 text-xl font-bold'> DAILY WERD </Text>
      </View>

        {/* Streak + Pages */}
      <View className='w-[100%] mt-10 flex-row justify-center items-center'>
        
        <Card sideIcon="local-fire-department" sideText="STREAK" mainText="15 Days" underText="Personal Best!"/>
        <Card sideText="TOTAL PAGES" mainText="412" underText="THIS MONTH"/>

      </View>

      {/* Today's Goal */}
      <View className='mt-10 ml-4 mr-4'>
        <View className='flex-row justify-between mb-3'>
          
          <Text className='font-bold tracking-widest'>TODAY'S GOAL</Text>

          <Text className='text-xs text-primaryGold font-bold'>WERD #04</Text>

        </View>
        <View>
          {/* Main Card */}
          <TodayCard />
        </View>
      </View>

    </SafeAreaView>
  )
}

export default werd
import { MaterialIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

      {/* Today's */}

    </SafeAreaView>
  )
}

export default werd
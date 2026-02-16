import { ReaderParams } from '@/types/reader_data';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const Card = ({sideIcon, sideText, mainText, underText}: any) =>{
  return  (
      <View className='flex-1 gap-2 bg-white dark:bg-surfaceBlack border border-gray-200 dark:border-borderDark rounded-lg p-4 ml-4 mr-4'>
        <View className='flex-row gap-3 items-center'>
          <MaterialIcons name={sideIcon} size={20} color={'#D4AF37'}/>
          <Text className='text-gray-600 dark:text-mutedWhite'>{sideText}</Text>
        </View>
        <View className='flex-row gap-3 items-center justify-center'>
          <Text className='text-gray-900 dark:text-white text-xl font-bold'>{mainText}</Text>
        </View>
        <View className='flex-row gap-3 items-center justify-center'>
          <Text className='text-gray-500 dark:text-light-300 text-m'>{underText}</Text>
        </View>      
      </View>
  )
}

const TodayCard = () => {
  const { t } = useTranslation();
  
  const onReadTodaysWerd = () => {
    const params : ReaderParams = {
      surahId: 0,
      sessionType: 'daily_werd'
    };

    router.push({
      pathname: '/reader',
      params: params as any
    })
  }

  const onCompleteManually = () => {
    
  }

  return (
    <View className='bg-white dark:bg-surfaceBlack border-[1px] border-gray-200 dark:border-mutedWhite rounded-[20px]'>
      <View className='flex-row justify-between mt-3 '>
        <View className='gap-2 mt-5 ml-5'>
          <Text className='font-bold text-[25px] text-gray-900 dark:text-white'>Al-Baqarah</Text>
          <Text className='text-gray-600 dark:text-mutedWhite'>Pages 10-25</Text>
        </View>
        <View className='border-[2px] border-primaryGold rounded-[20px] bg-goldGlow p-4 justify-center items-center mr-5 mt-4' >
          <MaterialIcons name='menu-book' size={35} color={'#D4AF37'}/>
        </View>        
      </View>
      
      <View className='mt-6 ml-5 mr-5 mb-3'>
        <View className='flex-row justify-between items-center'>
          <Text className='text-xs font-bold text-gray-900 dark:text-white'>{t('currentProgress')}</Text>
          <Text className='text-primaryGold font-semibold'>6/15 pages</Text>
        </View>     
        <View className='bg-gray-200 dark:bg-borderDark h-2.5 rounded-full overflow-hidden mt-2'>
          <LinearGradient
            colors={['#D4AF37', '#F1E5AC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '40%', height: '100%', borderRadius: 999 }}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={onReadTodaysWerd}
        activeOpacity={0.7}
        className='mt-5 h-20 p-4 bg-primaryGold rounded-2xl w-[80%] items-center justify-center self-center'
      >
        <View className='items-center justify-center'>
          <Text className='font-bold tracking-wide text-[17px]'>{t('readTodaysWerd')}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onCompleteManually}
        activeOpacity={0.7}
        className='mt-5 h-15 p-4 bg-gray-100 dark:bg-mutedBlack border-[1px] border-gray-300 dark:border-light-300 rounded-2xl w-[80%] items-center justify-center self-center mb-7'
      >
        <View className='items-center justify-center'>
          <Text className='font-bold tracking-wide text-[15px] text-gray-600 dark:text-mutedWhite'>{t('markCompleted')}</Text>
        </View>
      </TouchableOpacity>

    </View>
  )
}

const werd = () => {
  const { t } = useTranslation();
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-bgBlack">
      
      <View className='w-[100%] justify-center items-center'>
        <Text className='text-primaryGold mt-10 text-xl font-bold'> {t('dailyWerd')} </Text>
      </View>

      <View className='w-[100%] mt-10 flex-row justify-center items-center'>
        
        <Card sideIcon="local-fire-department" sideText={t('streak')} mainText="15 Days" underText={t('personalBest')}/>
        <Card sideText={t('totalPages')} mainText="412" underText={t('thisMonth')}/>

      </View>

      <View className='mt-10 ml-4 mr-4'>
        <View className='flex-row justify-between mb-3'>
          
          <Text className='font-bold tracking-widest text-gray-600 dark:text-mutedWhite'>{t('todaysGoal')}</Text>

          <Text className='text-xs text-primaryGold font-bold'>{t('werd')} #04</Text>

        </View>
        <View>
          <TodayCard />
        </View>
      </View>

    </SafeAreaView>
  )
}

export default werd
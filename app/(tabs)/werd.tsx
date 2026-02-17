import { ReaderParams } from '@/types/reader_data';
import { DailyProgress } from '@/utils/DatabaseManager';
import * as DB from '@/utils/DatabaseManager';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as PDFExporter from '@/services/PDFExporter';

const Card = ({ sideIcon, sideText, mainText, underText }: any) => {
  return (
    <View className='flex-1 gap-2 bg-white dark:bg-surfaceBlack border border-gray-200 dark:border-borderDark rounded-lg p-4 ml-4 mr-4'>
      <View className='flex-row gap-3 items-center'>
        <MaterialIcons name={sideIcon} size={20} color={'#D4AF37'} />
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

const TodayCard = ({ progress }: { progress: DailyProgress }) => {
  const { t } = useTranslation();

  const onReadTodaysWerd = () => {
    const params: ReaderParams = {
      surahId: 0,
      sessionType: 'daily_werd'
    };
    router.push({ pathname: '/reader', params: params as any });
  }

  const onExportPDF = async () => {
    Alert.alert('📄 Generating PDF', 'Please wait...', [{ text: 'OK' }]);
    const mockData = await PDFExporter.getTodaysWerdData();
    // @ts-ignore
    const success = await PDFExporter.generateAndSharePDF(mockData);
    if (!success) {
      Alert.alert('❌ Failed', 'Could not generate or share PDF');
    }
  };

  const progressPercent = progress.max_pages > 0
    ? Math.min((progress.total_pages / progress.max_pages) * 100, 100)
    : 0;

  return (
    <View className='bg-white dark:bg-surfaceBlack border-[1px] border-gray-200 dark:border-mutedWhite rounded-[20px]'>
      <View className='flex-row justify-between mt-3'>
        <View className='gap-2 mt-5 ml-5'>
          <Text className='font-bold text-[25px] text-gray-900 dark:text-white'>Werd #{progress.day_number}</Text>
          <Text className='text-gray-600 dark:text-mutedWhite'>
            {progress.total_pages} / {progress.max_pages} {t('pages')}
          </Text>
        </View>
        <View className='border-[2px] border-primaryGold rounded-[20px] bg-goldGlow p-4 justify-center items-center mr-5 mt-4'>
          <MaterialIcons name='menu-book' size={35} color={'#D4AF37'} />
        </View>
      </View>

      <View className='mt-6 ml-5 mr-5 mb-3'>
        <View className='flex-row justify-between items-center'>
          <Text className='text-xs font-bold text-gray-900 dark:text-white'>{t('currentProgress')}</Text>
          <Text className='text-primaryGold font-semibold'>{Math.round(progressPercent)}%</Text>
        </View>
        <View className='bg-gray-200 dark:bg-borderDark h-2.5 rounded-full overflow-hidden mt-2'>
          <LinearGradient
            colors={['#D4AF37', '#F1E5AC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 999 }}
          />
        </View>
      </View>

      <TouchableOpacity onPress={onReadTodaysWerd} activeOpacity={0.7} className='mt-5 h-20 p-4 bg-primaryGold rounded-2xl w-[80%] items-center justify-center self-center'>
        <Text className='font-bold tracking-wide text-[17px]'>{t('readTodaysWerd')}</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} className='mt-5 h-15 p-4 bg-goldMuted dark:bg-mutedBlack border-[1px] border-gray-300 dark:border-light-300 rounded-2xl w-[80%] items-center justify-center self-center mb-5'>
        <Text className='font-bold tracking-wide text-[15px] text-gray-600'>{t('markCompleted')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onExportPDF} activeOpacity={0.7} className='mt-3 h-15 p-4 bg-primaryGold rounded-2xl w-[80%] items-center justify-center self-center mb-7'>
        <View className='flex-row items-center justify-center gap-2'>
          <MaterialIcons name='picture-as-pdf' size={20} color={'#000'} />
          <Text className='font-bold tracking-wide text-[15px] text-black'>{"Export Today's Werd as PDF"}</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const werd = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<DB.StreakData | null>(null);
  const [progress, setProgress] = useState<DailyProgress | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const streakData = await DB.getStreak();
        setStreak(streakData);

        const result = await DB.getLastStopped();
        const dayNum = typeof result === 'number' ? result : (result as any)?.day_number;

        if (dayNum) {
          const dailyData = await DB.getDailyProgress(dayNum);
          if (dailyData) {
            const first = typeof dailyData.start_verse === 'number' ? dailyData.start_verse : (dailyData.start_verse as any)?.id;
            const last = typeof dailyData.end_verse === 'number' ? dailyData.end_verse : (dailyData.end_verse as any)?.id;
            const totalPages = await DB.getPageCount(first, last);
            setProgress({
              ...dailyData,
              max_pages: totalPages || dailyData.max_pages
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <SafeAreaView className="flex-1 justify-center"><ActivityIndicator color="#D4AF37" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-bgBlack">
      <ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='w-[100%] justify-center items-center'>
          <Text className='text-primaryGold mt-10 text-xl font-bold'> {t('dailyWerd')} </Text>
        </View>

        <View className='w-[100%] mt-10 flex-row justify-center items-center'>
          <Card sideIcon="local-fire-department" sideText={t('streak')} mainText={`${streak?.count || 0} ${t('days')}`} underText={t('personalBest')} />
          <Card sideText={t('totalPages')} mainText="412" underText={t('thisMonth')} />
        </View>

        <View className='mt-10 ml-4 mr-4'>
          <View className='flex-row justify-between mb-3'>
            <Text className='font-bold tracking-widest text-gray-600 dark:text-mutedWhite'>{t('todaysGoal')}</Text>
            <Text className='text-xs text-primaryGold font-bold'>{t('werd')} #{progress?.day_number || '00'}</Text>
          </View>
          <View>
            {progress && <TodayCard progress={progress} />}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default werd;
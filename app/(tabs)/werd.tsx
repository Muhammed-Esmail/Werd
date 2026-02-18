import { ReaderParams } from '@/types/reader_data';
import { DailyProgress } from '@/utils/DatabaseManager';
import * as DB from '@/utils/DatabaseManager';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as PDFExporter from '@/services/PDFExporter';
import { useStreak } from '@/services/StreakManager';

type PdfStatus = 'idle' | 'loading' | 'done' | 'error';

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

const TodayCard = ({ progress, onExportPDF, onComplete }: { progress: DailyProgress, onExportPDF: () => void, onComplete: () => void }) => {
  const { t } = useTranslation();
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    const load = async () => {
      const settings = await DB.getSettings();
      if (settings?.reading_mode === 0) {
        setProgressPercent(progress.scroll_percentage ?? 0);
      } else {
        setProgressPercent(
          progress.last_page > 0
            ? Math.min((progress.last_page / progress.total_pages) * 100, 100)
            : 0
        );
      }
    };
    load();
  }, [progress]);

  const onReadTodaysWerd = () => {
    const params: ReaderParams = { surahId: 0, sessionType: 'daily_werd' };
    router.push({ pathname: '/reader', params: params as any });
  };

  return (
    <View className='bg-white dark:bg-surfaceBlack border-[1px] border-gray-200 dark:border-mutedWhite rounded-[20px]'>
      <View className='flex-row justify-between mt-3'>
        <View className='gap-2 mt-5 ml-5'>
          <Text className='font-bold text-[25px] text-gray-900 dark:text-white'>
            {t('werdNumber', { number: progress.day_number })}
          </Text>
          <Text className='text-gray-600 dark:text-mutedWhite'>
            {progress.last_page} / {progress.total_pages} {t('pages')}
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

      <TouchableOpacity onPress = {onComplete} activeOpacity={0.7} className='mt-5 h-15 p-4 bg-goldMuted dark:bg-mutedBlack border-[1px] border-gray-300 dark:border-light-300 rounded-2xl w-[80%] items-center justify-center self-center mb-5'>
        <Text className='font-bold tracking-wide text-[15px] text-gray-600'>{t('markCompleted')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onExportPDF} activeOpacity={0.7} className='mt-3 h-15 p-4 bg-primaryGold rounded-2xl w-[80%] items-center justify-center self-center mb-7'>
        <View className='flex-row items-center justify-center gap-2'>
          <MaterialIcons name='picture-as-pdf' size={20} color={'#000'} />
          <Text className='font-bold tracking-wide text-[15px] text-black'>{t('exportPDF')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const PdfToast = ({ status }: { status: PdfStatus }) => {
  const { t } = useTranslation();
  if (status === 'idle') return null;
  return (
    <View className={`mt-4 w-full flex-row items-center justify-center gap-3 px-5 py-3 rounded-full border self-start ${
      status === 'error'
        ? 'bg-red-950 border-red-500'
        : status === 'done'
        ? 'bg-neutral-900 border-settingsGold'
        : 'bg-neutral-900 border-settingsGold/30'
    }`}>
      {status === 'loading' && <ActivityIndicator size="small" color="#D4AF37" />}
      {status === 'done' && <Text>✅</Text>}
      {status === 'error' && <Text>❌</Text>}
      <Text className='text-white font-semibold'>
        {status === 'loading' ? t('generating') : status === 'done' ? t('exportSuccess') : t('exportFailed')}
      </Text>
    </View>
  );
}

const werd = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<DB.StreakData | null>(null);
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [donePages, setDonePages] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle');
  const { incrementStreak } = useStreak();

  const handleCompleted = async () => {
      await incrementStreak();
      const today = await DB.getLastStopped();
      await DB.updateDailyProgress({ is_completed: 1 }, today!);
      const tomorrow = await DB.getDailyProgress(today! + 1);
      setProgress(tomorrow);
      const updatedStreak = await DB.getStreak();        
      setStreak(updatedStreak);
      const updatedCount = await DB.getDoneVersesCount();
      setDonePages(updatedCount || 0); 
    };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const streakData = await DB.getStreak();
          // @ts-ignore
          setStreak(streakData);

          const result = await DB.getLastStopped();
          if (result !== null) {
            const dailyData = await DB.getDailyProgress(result);
            if (dailyData) setProgress(dailyData);
          }
          const count = await DB.getDoneVersesCount();
          setDonePages(count || 0);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const onExportPDF = async () => {
    setPdfStatus('loading');
    const mockData = await PDFExporter.getTodaysWerdData();
    // @ts-ignore
    const success = await PDFExporter.generateAndSharePDF(mockData);
    setPdfStatus(success ? 'done' : 'error');
    setTimeout(() => setPdfStatus('idle'), 3000);
  };

  if (loading) return <SafeAreaView className="flex-1 justify-center"><ActivityIndicator color="#D4AF37" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-bgBlack">
      <ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        <View className='w-[100%] justify-center items-center'>
          <Text className='text-primaryGold mt-10 text-xl font-bold'> {t('dailyWerd')} </Text>
        </View>

        <View className='w-[100%] mt-10 flex-row justify-center items-center'>
          <Card sideIcon="local-fire-department" sideText={t('streak')} mainText={`${streak?.count || 0} ${t('days')}`} underText={t('personalBest')} />
          <Card sideText={t('totalPages')} mainText={donePages} underText={t('thisMonth')} />
        </View>

        <View className='mt-10 ml-4 mr-4'>
          <View className='flex-row justify-between mb-3'>
            <Text className='font-bold tracking-widest text-gray-600 dark:text-mutedWhite'>{t('todaysGoal')}</Text>
            <Text className='text-xs text-primaryGold font-bold'>{t('werd')} #{progress?.day_number || '00'}</Text>
          </View>
          {progress && <TodayCard progress={progress} onExportPDF={onExportPDF} onComplete={handleCompleted}/>}
          <PdfToast status={pdfStatus} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default werd;
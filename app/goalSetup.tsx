import { StyleSheet, Text, View, Pressable, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DB from "@/utils/DatabaseManager"
import { useTranslation } from 'react-i18next';
import * as engine from "@/core/SegmentationEngine"
import { useColorScheme } from 'nativewind';

const RadioButton = ({ text, selected, description, onSelected }: any) => {
    return (
        <Pressable
            onPress={onSelected}
            className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border-2 ${selected ? "border-primaryGold bg-gray-100 dark:bg-[#1A1A1A]" : "border-gray-300 dark:border-gray-800 bg-transparent"
                }`}
        >
            <View className="flex-1 mr-2">
                <Text className={`text-lg ${selected ? "text-primaryGold font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                    {text}
                </Text>
                <Text className={`${selected ? "text-primaryGold/80" : "text-gray-400 dark:text-gray-500"} text-xs`}>
                    {description}
                </Text>
            </View>
            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${selected ? 'border-primaryGold' : 'border-gray-400 dark:border-gray-600'
                }`}>
                {selected && <View className="h-2.5 w-2.5 rounded-full bg-primaryGold" />}
            </View>
        </Pressable>
    );
}

const goalSetup = () => {
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    
    const [date, setDate] = useState(new Date())
    const [show, setShow] = useState<boolean>(false)
    const [selectedGoal, setGoal] = useState<number>(1);
    const [prevGoal, setPrevGoal] = useState<number>(1);
    const [selectedPartition, setPartition] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    const GOAL_OPTIONS = [
        { id: 1, text: t('casual'), description: t('threeMonths'), days: 90 },
        { id: 2, text: t('regular'), description: t('twoMonths'), days: 60 },
        { id: 3, text: t('ramadanSpecial'), description: t('oneMonth'), days: 30 },
        { id: 4, text: t('serious'), description: t('oneWeek'), days: 7 },
    ];

    const PARTITION_OPTIONS = [
        { id: 1, text: t('byJuz'), description: t('readJuzPerDay'), partitionType: 'juz' },
        { id: 2, text: t('bySurah'), description: t('readSurahPerDay'), partitionType: 'surah' },
        { id: 3, text: t('byPage'), description: t('readPagesPerDay'), partitionType: 'page' }
    ]
    const setWerdSettings = async () => {
        const db = await DB.getDB();
        const isEmpty = await DB.isEmpty(db, "daily_progress");
        
        if (isEmpty) {
            await executePlanCalculation(true);
        } else {
            setShowResetModal(true);
        }
    }

    const executePlanCalculation = async (reset: boolean) => {
        setShowResetModal(false);
        setIsLoading(true);
        
        try {
            let goalDays = 0;
            if (selectedGoal === 5) {
                const now = new Date();
                goalDays = Math.ceil(Math.abs(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            } else {
                goalDays = GOAL_OPTIONS[selectedGoal - 1].days;
            }

            const pTypeString = PARTITION_OPTIONS[selectedPartition - 1].partitionType;
            await DB.updateSettings({ werd_plan_days: goalDays, partition_type: pTypeString });

            let partitionEnum: engine.PartitionType;
            if (pTypeString === 'juz') partitionEnum = engine.PartitionType.JUZ;
            else if (pTypeString === 'surah') partitionEnum = engine.PartitionType.SURAH;
            else partitionEnum = engine.PartitionType.PAGE;

            const db = await DB.getDB();

            if (reset) {
                console.log("HERE1111")
                await engine.SegmentationEngine.calculatePlan(goalDays, partitionEnum);
            } 
            else {
                const firstNotDone = await db.getFirstAsync(`SELECT * FROM daily_progress WHERE is_completed = 0 ORDER BY day_number ASC LIMIT 1`) as DB.DailyProgress;
                if (firstNotDone.day_number === 1) {
                    console.log("HERE2222")
                    await engine.SegmentationEngine.calculatePlan(goalDays, partitionEnum);
                } else {
                    console.log("HERE3333")
                    await engine.SegmentationEngine.recalculatePlan(db, firstNotDone.day_number, firstNotDone.start_verse - 1, goalDays, partitionEnum);
                }
            }
            router.back();
        } catch (e) {
            console.error("Calculation Error:", e);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const init = async () => {
            const current_settings = await DB.getSettings() as DB.UserSettings
            if(!current_settings) return;
            
            const days = current_settings.werd_plan_days;
            if (days === 90) setGoal(1);
            else if (days === 60) setGoal(2);
            else if (days === 30) setGoal(3);
            else if (days === 7) setGoal(4);
            else if (days > 0) setGoal(5);

            const part = current_settings.partition_type;
            if (part === 'juz') setPartition(1);
            else if (part === 'surah') setPartition(2);
            else setPartition(3);
        };
        init();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-matteBlack">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Reset Choice Modal */}
            <Modal visible={showResetModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-[#1A1A1A] p-6 rounded-t-[40px] border-t border-primaryGold">
                        <View className="w-12 h-1 bg-gray-300 dark:bg-white/10 rounded-full self-center mb-6" />
                        <Text className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                            {t('existingProgressFound')}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center mb-8 px-4">
                            {t('chooseStartingPoint')}
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => executePlanCalculation(false)}
                            className="bg-primaryGold p-4 rounded-2xl mb-3 shadow-sm"
                        >
                            <Text className="text-matteBlack font-bold text-center text-lg">{t('continueFromLastStop')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => executePlanCalculation(true)}
                            className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6"
                        >
                            <Text className="text-red-500 font-bold text-center text-lg">{t('startFromBeginning')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowResetModal(false)} className="pb-4">
                            <Text className="text-gray-400 text-center font-semibold">{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Loading Modal */}
            <Modal visible={isLoading} transparent animationType="fade">
                <View className="flex-1 bg-black/60 justify-center items-center">
                    <View className="bg-white dark:bg-surfaceBlack p-10 rounded-[30px] items-center w-3/4">
                        <ActivityIndicator size="large" color="#D4AF37" />
                        <Text className="text-black dark:text-white text-lg font-bold mt-5">{t('calculatingPlan')}</Text>
                        <Text className="text-gray-500 text-sm mt-2">{t('pleaseWait')}</Text>
                    </View>
                </View>
            </Modal>

            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
                <Text className="text-3xl font-bold text-primaryGold text-center mt-6">{t('werdGoal')}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mb-10">{t('choosePlan')}</Text>

                <Text className="text-primaryGold mb-4 text-xl font-bold uppercase tracking-widest">{t('finishingPeriod')}</Text>
                
                {GOAL_OPTIONS.map((item) => (
                    <RadioButton 
                        key={item.id}
                        text={item.text} 
                        description={item.description} 
                        selected={selectedGoal === item.id} 
                        onSelected={() => setGoal(item.id)} 
                    />
                ))}

                <RadioButton 
                    text={t('custom')} 
                    description={t('customPeriod')} 
                    selected={selectedGoal === 5} 
                    onSelected={() => { setPrevGoal(selectedGoal); setShow(true); }} 
                />

                {show && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        onChange={(event, selectedDate) => {
                            setShow(false);
                            if (event.type === 'set' && selectedDate) {
                                setDate(selectedDate);
                                setGoal(5);
                            } else {
                                setGoal(prevGoal);
                            }
                        }}
                        minimumDate={new Date()}
                    />
                )}

                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 w-full my-8" />

                <Text className="text-primaryGold mb-4 text-xl font-bold uppercase tracking-widest">{t('partitioning')}</Text>
                {PARTITION_OPTIONS.map((item) => (
                    <RadioButton 
                        key={item.id}
                        text={item.text} 
                        description={item.description} 
                        selected={selectedPartition === item.id} 
                        onSelected={() => setPartition(item.id)} 
                    />
                ))}

                <TouchableOpacity
                    onPress={setWerdSettings}
                    disabled={isLoading}
                    className="bg-primaryGold rounded-2xl py-5 mt-10 mb-10 shadow-lg active:opacity-80"
                >
                    <Text className="text-matteBlack font-black text-xl text-center">{t('startMyWerd')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

export default goalSetup
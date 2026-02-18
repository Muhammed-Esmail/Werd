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
            <View>
                <Text className={`${selected ? "text-green-600 dark:text-successGreen font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                    {text}
                </Text>
                <Text className={`${selected ? "text-green-600 dark:text-successGreen" : "text-gray-500 dark:text-gray-300"}`}>
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

    const GOAL_OPTIONS = [
        { id: 1, text: t('casual'), description: t('threeMonths'), days: 90 },
        { id: 2, text: t('regular'), description: t('twoMonths'), days: 60 },
        { id: 3, text: t('Ramdan Special'), description: t('oneMonth'), days: 30 },
        { id: 4, text: t('serious'), description: t('oneWeek'), days: 7 },
    ];

    const PARTITION_OPTIONS = [
        { id: 1, text: t('byJuz'), description: t('readJuzPerDay'), partitionType: 'juz' },
        { id: 2, text: t('bySurah'), description: t('readSurahPerDay'), partitionType: 'surah' },
        { id: 3, text: t('byPage'), description: t('readPagesPerDay'), partitionType: 'page' }
    ]

    const setWerdSettings = async () => {
        setIsLoading(true);
        try {
            let goal = 0
            if (selectedGoal === 5) {
                const now = new Date()
                goal = Math.ceil(Math.abs(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            }
            else goal = GOAL_OPTIONS[selectedGoal - 1].days
            await DB.updateSettings({ werd_plan_days: goal, partition_type: PARTITION_OPTIONS[selectedPartition - 1].partitionType })
            const settings = await DB.getSettings() as DB.UserSettings
            console.log(`settings = ${settings.werd_plan_days} , ${settings.partition_type}`)
            let partition: engine.PartitionType
            if (selectedPartition === 1) partition = engine.PartitionType.JUZ
            if (selectedPartition === 2) partition = engine.PartitionType.SURAH
            else partition = engine.PartitionType.PAGE

            const db = await DB.getDB()
            let currentDay, lastCompletedVerse;
            const firstNotDoneProgress = await db.getFirstAsync(`SELECT * FROM daily_progress WHERE day_number = (
                    SELECT MIN(day_number) FROM daily_progress WHERE is_completed = 0
                )`) as DB.DailyProgress
            if (!firstNotDoneProgress) {
                currentDay = 1
                lastCompletedVerse = 1
            }
            else {
                currentDay = firstNotDoneProgress.day_number
                lastCompletedVerse = firstNotDoneProgress.start_verse - 1
            }
            const userSettings = await DB.getSettings() as DB.UserSettings
            const totalDays: number = userSettings.werd_plan_days
            let partitionType: engine.PartitionType
            if (settings.partition_type === "juz") partitionType = engine.PartitionType.JUZ
            else if (settings.partition_type === "surah") partitionType = engine.PartitionType.SURAH
            else partitionType = engine.PartitionType.PAGE
            if (await DB.isEmpty(await DB.getDB(), "daily_progress")) await engine.SegmentationEngine.calculatePlan(goal, engine.PartitionType.JUZ)
            else await engine.SegmentationEngine.recalculatePlan(db, currentDay, lastCompletedVerse, totalDays, partitionType)
            router.back();
        } catch (e) {
            console.error("Goal Setup Error:", e);
        } finally {
            setIsLoading(false);
        }
    }

    const renderOption = (item: any, currentSelected: number, setter: (id: number) => void) => {
        return (
            <RadioButton text={item.text} description={item.description} selected={currentSelected === item.id} onSelected={
                async () => {
                    setter(item.id)
                }
            }></RadioButton>
        );
    }

    useEffect(() => {
        const init = async () => {
            // @ts-ignore
            const current_settings = await DB.getSettings() as DB.UserSettings
            if(!current_settings) return;
            const days = current_settings.werd_plan_days
            const partition = current_settings.partition_type
            if (days === 90) setGoal(1);
            else if (days === 60) setGoal(2)
            else if (days === 30) setGoal(3)
            else if (days === 7) setGoal(4)
            else setGoal(5)

            if (partition === 'juz') setPartition(1)
            else if (partition === 'surah') setPartition(2)
            else setPartition(3);
        };
        init();
    }, []);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Full-screen Loading Overlay */}
            <Modal
                visible={isLoading}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
                            borderRadius: 24,
                            padding: 36,
                            alignItems: 'center',
                            width: '75%',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 16,
                            elevation: 10,
                        }}
                    >
                        <ActivityIndicator size="large" color="#D4AF37" />
                        <Text
                            style={{
                                color: colorScheme === 'dark' ? '#ffffff' : '#111827',
                                fontSize: 17,
                                fontWeight: '700',
                                marginTop: 20,
                                textAlign: 'center',
                            }}
                        >
                            {t('calculatingPlan')}
                        </Text>
                        <Text
                            style={{
                                color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
                                fontSize: 13,
                                marginTop: 8,
                                textAlign: 'center',
                            }}
                        >
                            {t('pleaseWait')}
                        </Text>
                    </View>
                </View>
            </Modal>

            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-matteBlack">
                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    <Text className="text-3xl font-bold text-primaryGold tracking-tight text-center mt-4">{t('werdGoal')}</Text>
                    <Text className="text-gray-500 dark:text-light-300 text-sm mt-1 text-center mb-10">{t('choosePlan')}</Text>

                    <Text className="text-primaryGold mb-4 text-2xl font-bold">{t('finishingPeriod')}</Text>
                    <FlatList
                        data={GOAL_OPTIONS}
                        renderItem={({ item }) => renderOption(item, selectedGoal, setGoal)}
                        keyExtractor={(item) => item.id.toString()}
                        extraData={selectedGoal}
                        scrollEnabled={false}
                    />

                    <RadioButton text={t('custom')} description={t('customPeriod')} selected={selectedGoal === 5} onSelected={() => { setPrevGoal(selectedGoal); setShow(true) }}></RadioButton>
                    {show && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={'default'}
                            onChange={async (event: any, selectedDate: any) => {
                                if (event.type === 'set') {
                                    console.log(selectedDate);
                                    if (selectedDate) setDate(selectedDate);
                                    setGoal(5)
                                }
                                else {
                                    console.log("user cancelled")
                                    setGoal(prevGoal)
                                }
                                setShow(false);
                            }}
                            minimumDate={new Date()}
                        />
                    )}
                    <View className="h-[1px] bg-gray-300 dark:bg-gray-800 w-full my-8" />

                    <Text className="text-primaryGold mb-4 text-2xl font-bold">{t('partitioning')}</Text>
                    <FlatList
                        data={PARTITION_OPTIONS}
                        renderItem={({ item }) => renderOption(item, selectedPartition, setPartition)}
                        keyExtractor={(item) => item.id.toString()}
                        extraData={selectedPartition}
                        scrollEnabled={false}
                    />

                    <View className="h-[1px] bg-gray-300 dark:bg-gray-800 w-full my-8" />

                    <TouchableOpacity
                        onPress={setWerdSettings}
                        disabled={isLoading}
                        className="bg-gray-100 dark:bg-[#1A1A1A] border-2 border-primaryGold rounded-2xl py-4 px-8 mt-10 active:opacity-70"
                    >
                        <Text className="text-primaryGold text-base font-bold text-xl text-center">{t('startMyWerd')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

export default goalSetup
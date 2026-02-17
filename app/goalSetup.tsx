import { StyleSheet, Text, View, Pressable, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import * as DB from "@/utils/DatabaseManager"
import { useTranslation } from 'react-i18next';
import * as engine from "@/core/SegmentationEngine"

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
    const [date, setDate] = useState(new Date())
    const [show, setShow] = useState<boolean>(false)

    const [selectedGoal, setGoal] = useState<number>(1);
    const [prevGoal, setPrevGoal] = useState<number>(1);
    const [selectedPartition, setPartition] = useState<number>(1);

    const [sliderValue, setSliderValue] = useState<number>(3)

    const GOAL_OPTIONS = [
        { id: 1, text: t('casual'), description: t('threeMonths'), days: 90 },
        { id: 2, text: t('regular'), description: t('oneMonth'), days: 30 },
        { id: 3, text: t('serious'), description: t('oneWeek'), days: 7 },
    ];

    const PARTITION_OPTIONS = [
        { id: 1, text: t('byJuz'), description: t('readJuzPerDay'), partitionType: 'juz' },
        { id: 2, text: t('bySurah'), description: t('readSurahPerDay'), partitionType: 'surah' },
        { id: 3, text: t('byPage'), description: t('readPagesPerDay'), partitionType: 'page' }
    ]

    const setWerdSettings = async () => {
        let goal = 0
        if (selectedGoal === 4) {
            const now = new Date()
            goal = Math.ceil(Math.abs(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
        else goal = GOAL_OPTIONS[selectedGoal - 1].days
        await DB.updateSettings({ werd_plan_days: goal, partition_type: PARTITION_OPTIONS[selectedPartition - 1].partitionType })
        alert("Werd Settings Set!")
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
            lastCompletedVerse = firstNotDoneProgress.end_verse
        }
        const userSettings = await DB.getSettings() as DB.UserSettings
        const totalDays: number = userSettings.werd_plan_days
        let partitionType: engine.PartitionType
        if (settings.partition_type === "juz") partitionType = engine.PartitionType.JUZ
        else if (settings.partition_type === "surah") partitionType = engine.PartitionType.SURAH
        else partitionType = engine.PartitionType.PAGE
        if (await DB.isEmpty(await DB.getDB(), "daily_progress") || firstNotDoneProgress.day_number === 1) await engine.SegmentationEngine.calculatePlan(goal, engine.PartitionType.JUZ)
        else await engine.SegmentationEngine.recalculatePlan(db, currentDay, lastCompletedVerse, totalDays, partitionType)
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

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
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

                    <RadioButton text={t('custom')} description={t('customPeriod')} selected={selectedGoal === 4} onSelected={() => { setPrevGoal(selectedGoal); setShow(true) }}></RadioButton>
                    {show && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={'default'}
                            onChange={async (event: any, selectedDate: any) => {
                                if (event.type === 'set') {
                                    console.log(selectedDate);
                                    if (selectedDate) setDate(selectedDate);
                                    setGoal(4)
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

                    {selectedPartition === 3 && (
                        <View className="mt-4 mb-2 p-4 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl border-2 border-gray-300 dark:border-gray-800">
                            <Text className="text-primaryGold mb-3 text-center text-lg font-bold">
                                {sliderValue} {t('pagesPerDay')}
                            </Text>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={1}
                                maximumValue={50}
                                step={1}
                                value={sliderValue}
                                onValueChange={(value) => setSliderValue(value)}
                                minimumTrackTintColor="#D4AF37"
                                maximumTrackTintColor="#374151"
                                thumbTintColor="#D4AF37"
                            />
                            <View className="flex-row justify-between mt-1">
                                <Text className="text-gray-400 text-xs">1 {t('page')}</Text>
                                <Text className="text-gray-400 text-xs">50 {t('page')}</Text>
                            </View>
                        </View>
                    )}

                    <View className="h-[1px] bg-gray-300 dark:bg-gray-800 w-full my-8" />

                    <TouchableOpacity
                        onPress={setWerdSettings}
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
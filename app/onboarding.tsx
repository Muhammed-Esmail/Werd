import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, Switch, ScrollView, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from "nativewind";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DB from '@/utils/DatabaseManager';
import * as engine from "@/core/SegmentationEngine";
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const FONT_OPTIONS = ['D1', 'U3', 'Amiri-Regular', 'HAFS']; 

const Onboarding = () => {
    const router = useRouter();
    const { colorScheme, setColorScheme } = useColorScheme();
    const { t } = useTranslation();

    // Steps: 0=Intro/Lang, 1=Appearance, 2=Reading Prefs, 3=Goal
    const [step, setStep] = useState(0);

    // State for all settings
    const [planDays, setPlanDays] = useState(30);
    const [selectedFont, setSelectedFont] = useState('D1');
    const [readingMode, setReadingMode] = useState(0); // 0: Scroll, 1: Page
    const [partitionType, setPartitionType] = useState('page'); // 'page', 'surah', 'juz'

    const toggleTheme = async (val: boolean) => {
        const newTheme = val ? 'dark' : 'light';
        setColorScheme(newTheme);
    };

    const changeLanguage = async (lang: string) => {
        await i18n.changeLanguage(lang);
        const isRTL = lang === 'ar';
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
    };

    const handleSkip = async () => {
        await applySettingsAndFinish({
            font: 'D1',
            reading_mode: 0,
            partition_type: 'page',
            werd_plan_days: 30,
            theme: colorScheme === 'dark' ? 0 : 1,
            language: i18n.language
        });
    };

    const handleFinish = async () => {
        await applySettingsAndFinish({
            font: selectedFont,
            reading_mode: readingMode,
            partition_type: partitionType,
            werd_plan_days: planDays,
            theme: colorScheme === 'dark' ? 0 : 1,
            language: i18n.language
        });
    };

    const applySettingsAndFinish = async (finalSettings: any) => {
        try {
            await DB.updateSettings({
                ...finalSettings,
                // @ts-ignore
                setup_completed: 1
            });

            let pType = engine.PartitionType.PAGE;
            if (finalSettings.partition_type === 'juz') pType = engine.PartitionType.JUZ;
            if (finalSettings.partition_type === 'surah') pType = engine.PartitionType.SURAH;

            console.log(`Generating plan: ${finalSettings.werd_plan_days} days, Type: ${finalSettings.partition_type}`);
            await engine.SegmentationEngine.calculatePlan(
                finalSettings.werd_plan_days, 
                pType
            );

            router.replace('/(tabs)/werd');
        } catch (e) {
            console.error("Onboarding Finish Error:", e);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-bgBlack justify-between p-6">
            
            {/* Header: Progress & Skip */}
            <View className="flex-row justify-between items-center mt-2">
                <View className="flex-row space-x-2">
                    {[0, 1, 2, 3].map(i => (
                        <View key={i} className={`h-1.5 rounded-full ${step >= i ? 'w-6 bg-primaryGold' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />
                    ))}
                </View>
                <TouchableOpacity onPress={handleSkip}>
                    <Text className="text-gray-400 dark:text-gray-500 font-medium">Skip Setup</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 justify-center mt-4">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
                    
                    {/* STEP 0: Welcome & Language */}
                    {step === 0 && (
                        <View className="items-center w-full">
                            <MaterialIcons name="menu-book" size={80} color="#D4AF37" />
                            <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6 text-center">
                                Welcome to Werd
                            </Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 mb-8 px-4">
                                Choose your preferred language. You can change everything later in Settings.
                            </Text>

                            <View className="flex-row gap-4 w-full justify-center">
                                <TouchableOpacity 
                                    onPress={() => changeLanguage('en')}
                                    className={`w-[45%] p-4 rounded-2xl border-2 items-center ${i18n.language === 'en' ? 'bg-primaryGold border-primaryGold' : 'border-gray-300 dark:border-gray-700'}`}
                                >
                                    <Text className={`font-bold text-lg ${i18n.language === 'en' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>English</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => changeLanguage('ar')}
                                    className={`w-[45%] p-4 rounded-2xl border-2 items-center ${i18n.language === 'ar' ? 'bg-primaryGold border-primaryGold' : 'border-gray-300 dark:border-gray-700'}`}
                                >
                                    <Text className={`font-bold text-lg ${i18n.language === 'ar' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>العربية</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* STEP 1: Appearance (Theme & Font) */}
                    {step === 1 && (
                        <View className="items-center w-full">
                            <MaterialIcons name="format-paint" size={60} color="#D4AF37" />
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-8">Appearance</Text>
                            
                            {/* Dark Mode */}
                            <View className="flex-row items-center justify-between w-full bg-white dark:bg-surfaceBlack p-5 rounded-2xl border border-gray-200 dark:border-white/10 mb-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="moon" size={20} color={colorScheme === 'dark' ? '#D4AF37' : 'gray'} />
                                    <Text className="text-lg font-medium text-gray-900 dark:text-white ml-3">Dark Mode</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#767577', true: '#D4AF37' }}
                                    thumbColor={colorScheme === 'dark' ? '#f5dd4b' : '#f4f3f4'}
                                    onValueChange={toggleTheme}
                                    value={colorScheme === 'dark'}
                                />
                            </View>

                            {/* Font Selection */}
                            <Text className="self-start ml-2 mb-2 text-gray-500 font-bold uppercase text-xs tracking-widest">Quran Font</Text>
                            <View className="w-full flex-row flex-wrap justify-between">
                                {FONT_OPTIONS.map(font => (
                                    <TouchableOpacity 
                                        key={font}
                                        onPress={() => setSelectedFont(font)}
                                        className={`w-[48%] mb-3 p-3 rounded-xl border-2 items-center justify-center ${selectedFont === font ? 'border-primaryGold bg-goldGlow/20' : 'border-gray-200 dark:border-white/5'}`}
                                    >
                                        <Text style={{ fontFamily: font }} className="text-xl text-gray-900 dark:text-white">آية</Text>
                                        <Text className="text-xs text-gray-400 mt-1">{font}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* STEP 2: Reading Preferences */}
                    {step === 2 && (
                        <View className="items-center w-full">
                            <MaterialIcons name="chrome-reader-mode" size={60} color="#D4AF37" />
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-8">Reading Style</Text>

                            {/* Mode Selection */}
                            <View className="flex-row w-full gap-4 mb-8">
                                <TouchableOpacity 
                                    onPress={() => setReadingMode(0)}
                                    className={`flex-1 p-4 rounded-2xl border-2 items-center ${readingMode === 0 ? 'border-primaryGold bg-goldGlow/10' : 'border-gray-200 dark:border-white/10'}`}
                                >
                                    <MaterialIcons name="smartphone" size={30} color={readingMode === 0 ? '#D4AF37' : 'gray'} />
                                    <Text className={`mt-2 font-bold ${readingMode === 0 ? 'text-primaryGold' : 'text-gray-500'}`}>Vertical Scroll</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setReadingMode(1)}
                                    className={`flex-1 p-4 rounded-2xl border-2 items-center ${readingMode === 1 ? 'border-primaryGold bg-goldGlow/10' : 'border-gray-200 dark:border-white/10'}`}
                                >
                                    <MaterialIcons name="menu-book" size={30} color={readingMode === 1 ? '#D4AF37' : 'gray'} />
                                    <Text className={`mt-2 font-bold ${readingMode === 1 ? 'text-primaryGold' : 'text-gray-500'}`}>Paged Mode</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Partition Selection */}
                            <Text className="self-start ml-2 mb-2 text-gray-500 font-bold uppercase text-xs tracking-widest">Divide Werd By</Text>
                            <View className="w-full bg-white dark:bg-surfaceBlack rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                {['page', 'surah', 'juz'].map((type, index) => (
                                    <TouchableOpacity 
                                        key={type}
                                        onPress={() => setPartitionType(type)}
                                        className={`p-4 flex-row justify-between items-center ${index !== 2 ? 'border-b border-gray-100 dark:border-white/5' : ''} ${partitionType === type ? 'bg-goldGlow/10' : ''}`}
                                    >
                                        <Text className={`capitalize text-base ${partitionType === type ? 'text-primaryGold font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                            By {type}
                                        </Text>
                                        {partitionType === type && <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* STEP 3: Goal */}
                    {step === 3 && (
                        <View className="items-center w-full">
                            <MaterialIcons name="track-changes" size={80} color="#D4AF37" />
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-6 text-center">Set Your Goal</Text>
                            <Text className="text-gray-500 mb-8 text-center px-4">
                                In how many days do you want to complete the Quran?
                            </Text>
                            
                            <View className="flex-row flex-wrap justify-center gap-4">
                                {[7, 30, 60, 90].map((days) => (
                                    <TouchableOpacity 
                                        key={days}
                                        onPress={() => setPlanDays(days)}
                                        className={`w-[40%] p-5 rounded-2xl border-2 items-center ${planDays === days ? 'bg-primaryGold border-primaryGold shadow-lg shadow-gold/20' : 'bg-white dark:bg-surfaceBlack border-gray-200 dark:border-white/10'}`}
                                    >
                                        <Text className={`font-bold text-xl ${planDays === days ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {days} Days
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <Text className="text-blue-600 dark:text-blue-400 text-center text-xs">
                                    Based on your selection, you will read roughly {Math.ceil(604 / planDays)} pages per day.
                                </Text>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </View>

            {/* Footer Navigation */}
            <View className="w-full mt-4">
                <TouchableOpacity 
                    onPress={() => step < 3 ? setStep(step + 1) : handleFinish()}
                    className="w-full bg-primaryGold p-4 rounded-xl items-center shadow-md shadow-gold/20"
                >
                    <Text className="text-white font-bold text-lg">
                        {step === 3 ? "Start Journey" : "Next"}
                    </Text>
                </TouchableOpacity>
                
                {step > 0 && (
                    <TouchableOpacity onPress={() => setStep(step - 1)} className="mt-4 items-center py-2">
                        <Text className="text-gray-500 dark:text-gray-400 font-medium">Back</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

export default Onboarding;
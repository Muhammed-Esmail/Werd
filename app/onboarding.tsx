import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from "nativewind";
import { MaterialIcons } from '@expo/vector-icons';
import * as DB from '@/utils/DatabaseManager';
import * as engine from "@/core/SegmentationEngine";

const { width } = Dimensions.get('window');

const Onboarding = () => {
    const router = useRouter();
    const { colorScheme, setColorScheme } = useColorScheme();
    const [step, setStep] = useState(0);
    const [planDays, setPlanDays] = useState(30);

    const toggleTheme = async (val: boolean) => {
        const newTheme = val ? 'dark' : 'light';
        setColorScheme(newTheme);
        await DB.updateSettings({ theme: newTheme === 'dark' ? 0 : 1 });
    };

    const finishOnboarding = async () => {
        try {
            await DB.updateSettings({ 
                werd_plan_days: planDays,
                partition_type: 'page',
                // @ts-ignore
                setup_completed: 1 
            });

            console.log(`Generating plan for ${planDays} days...`);
            await engine.SegmentationEngine.calculatePlan(planDays, engine.PartitionType.PAGE);

            router.replace('/(tabs)/werd'); 
        } catch (error) {
            console.error("Error finishing onboarding:", error);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-bgBlack justify-between p-6">
            
            <View className="flex-row justify-center mt-10 space-x-2">
                {[0, 1, 2].map(i => (
                    <View key={i} className={`h-2 rounded-full ${step >= i ? 'w-8 bg-primaryGold' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />
                ))}
            </View>

            <View className="flex-1 justify-center items-center">
                
                {step === 0 && (
                    <View className="items-center">
                        <MaterialIcons name="menu-book" size={100} color="#D4AF37" />
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-8 text-center">Welcome to Werd</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 px-4 text-lg">
                            Your companion for daily Quran reading and reflection.
                        </Text>
                    </View>
                )}

                {step === 1 && (
                    <View className="items-center w-full">
                        <MaterialIcons name="contrast" size={80} color="#D4AF37" />
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-10">Choose Appearance</Text>
                        
                        <View className="flex-row items-center justify-between w-full px-10 bg-white dark:bg-surfaceBlack p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                            <Text className="text-lg font-medium text-gray-900 dark:text-white">Dark Mode</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: '#D4AF37' }}
                                thumbColor={colorScheme === 'dark' ? '#f5dd4b' : '#f4f3f4'}
                                onValueChange={(val) => toggleTheme(val)}
                                value={colorScheme === 'dark'}
                            />
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View className="items-center w-full">
                        <MaterialIcons name="track-changes" size={80} color="#D4AF37" />
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-6 text-center">Set Your Goal</Text>
                        <Text className="text-gray-500 mb-8 text-center px-4">In how many days do you wish to complete the Quran?</Text>
                        
                        <View className="flex-row flex-wrap justify-center gap-4">
                            {[7, 30, 60, 90].map((days) => (
                                <TouchableOpacity 
                                    key={days}
                                    onPress={() => setPlanDays(days)}
                                    className={`w-[40%] p-4 rounded-xl border-2 items-center ${planDays === days ? 'bg-primaryGold border-primaryGold' : 'bg-transparent border-gray-300 dark:border-gray-700'}`}
                                >
                                    <Text className={`font-bold text-lg ${planDays === days ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {days} Days
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View className="w-full mb-5">
                <TouchableOpacity 
                    onPress={() => step < 2 ? setStep(step + 1) : finishOnboarding()}
                    className="w-full bg-primaryGold p-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">
                        {step === 2 ? "Get Started" : "Next"}
                    </Text>
                </TouchableOpacity>
                
                {step > 0 && (
                    <TouchableOpacity onPress={() => setStep(step - 1)} className="mt-4 items-center">
                        <Text className="text-gray-500 dark:text-gray-400">Back</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

export default Onboarding;
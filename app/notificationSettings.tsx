import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import * as NotificationManager from '@/services/NotificationManager';
import * as DatabaseManager from '@/utils/DatabaseManager';

const TIME_OPTIONS = [
    { id: 'morning', label: 'Morning', time: '8:00 AM', hour: 8, minute: 0, icon: 'wb-sunny' },
    { id: 'afternoon', label: 'Afternoon', time: '2:00 PM', hour: 14, minute: 0, icon: 'wb-twilight' },
    { id: 'evening', label: 'Evening', time: '8:00 PM', hour: 20, minute: 0, icon: 'nights-stay' },
];

const NotificationSettings = () => {
    const router = useRouter();

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [selectedTime, setSelectedTime] = useState('evening');
    const [currentStreak, setCurrentStreak] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeSettings();
    }, []);

    const initializeSettings = async () => {
        setIsLoading(true);

        try {
            console.log('🔔 Ensuring notification columns exist...');
            await DatabaseManager.addNotificationColumns();
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('🔔 Loading notification settings...');
            const savedSettings = await DatabaseManager.getNotificationSettings();

            if (savedSettings) {
                setNotificationsEnabled(savedSettings.notification_enabled === 1);
                setSelectedTime(savedSettings.notification_time || 'evening');

                console.log('✅ Loaded saved preferences:');
                console.log(`   Enabled: ${savedSettings.notification_enabled === 1}`);
                console.log(`   Time: ${savedSettings.notification_time} (${savedSettings.notification_hour}:${savedSettings.notification_minute})`);
            }

            const granted = await NotificationManager.hasPermissions();
            setHasPermission(granted);

            const streakData = await DatabaseManager.getStreak();
            if (streakData) {
                setCurrentStreak(streakData.count);
            }

        } catch (error) {
            console.error('Failed to initialize settings:', error);
            Alert.alert('Error', 'Failed to load notification settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleNotifications = async (value: boolean) => {
        if (value) {
            if (!hasPermission) {
                const granted = await NotificationManager.requestPermissions();

                if (!granted) {
                    Alert.alert(
                        '❌ Permission Denied',
                        'Please enable notifications in your device settings:\n\nSettings → Expo Go → Notifications',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                setHasPermission(true);
            }

            setNotificationsEnabled(true);

            const timeOption = TIME_OPTIONS.find(opt => opt.id === selectedTime);
            if (timeOption) {
                await DatabaseManager.updateNotificationSettings(
                    true,
                    selectedTime,
                    timeOption.hour,
                    timeOption.minute
                );
            }
        } else {
            await NotificationManager.cancelAllNotifications();
            setNotificationsEnabled(false);

            const timeOption = TIME_OPTIONS.find(opt => opt.id === selectedTime);
            if (timeOption) {
                await DatabaseManager.updateNotificationSettings(
                    false,
                    selectedTime,
                    timeOption.hour,
                    timeOption.minute
                );
            }

            Alert.alert(
                '✅ Notifications Disabled',
                'Daily reminders have been cancelled and settings saved',
                [{ text: 'OK' }]
            );
        }
    };

    const handleTimeSelect = (timeId: string) => {
        setSelectedTime(timeId);
    };

    const handleSaveSettings = async () => {
        if (!notificationsEnabled) {
            Alert.alert(
                '⚠️ Enable Notifications',
                'Please enable notifications first',
                [{ text: 'OK' }]
            );
            return;
        }

        setIsSaving(true);

        try {
            const timeOption = TIME_OPTIONS.find(opt => opt.id === selectedTime);

            if (!timeOption) {
                throw new Error('Invalid time selection');
            }

            const notificationId = await NotificationManager.scheduleDailyReminder(
                timeOption.hour,
                timeOption.minute
            );

            if (!notificationId) {
                throw new Error('Failed to schedule notification');
            }

            await DatabaseManager.updateNotificationSettings(
                true,
                selectedTime,
                timeOption.hour,
                timeOption.minute
            );

            Alert.alert(
                '✅ Settings Saved!',
                `Your preferences have been saved!\n\nYou will receive daily reminders at ${timeOption.time}.\n\nPersonalized with your ${currentStreak}-day streak!`,
                [{ text: 'OK', onPress: () => router.back() }]
            );

        } catch (error) {
            console.error('Failed to save settings:', error);
            Alert.alert(
                '❌ Error',
                'Failed to save notification settings. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestNotification = async () => {
        if (!hasPermission) {
            Alert.alert(
                '⚠️ Permission Required',
                'Please enable notifications first',
                [{ text: 'OK' }]
            );
            return;
        }

        const notifId = await NotificationManager.scheduleTestNotification(5, currentStreak);

        if (notifId) {
            Alert.alert(
                '🧪 Test Scheduled',
                `A notification will appear in 5 seconds with your ${currentStreak}-day streak.\n\n✨ Close the app to see it!`,
                [{ text: 'OK' }]
            );
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-matteBlack">
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: "Notification Settings",
                        headerStyle: { backgroundColor: '#0A0A0A' },
                        headerTintColor: '#D4AF37',
                        headerTitleStyle: { fontWeight: 'bold' },
                    }}
                />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#D4AF37" />
                    <Text className="text-mutedWhite mt-4">Loading settings...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-matteBlack">
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Notification Settings",
                    headerStyle: { backgroundColor: '#0A0A0A' },
                    headerTintColor: '#D4AF37',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />

            <ScrollView className="flex-1">
                {/* Header Section */}
                <View className="px-5 py-6">
                    <View className="items-center mb-2">
                        <MaterialIcons name="notifications-active" size={48} color="#D4AF37" />
                    </View>
                    <Text className="text-center text-white text-xl font-bold mb-2">
                        Daily Werd Reminders
                    </Text>
                    <Text className="text-center text-mutedWhite text-sm">
                        Stay consistent with personalized notifications
                    </Text>
                </View>

                {/* Current Streak Display */}
                <View className="mx-5 mb-6 p-4 bg-surfaceBlack rounded-2xl border border-primaryGold/30">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                            <MaterialIcons name="local-fire-department" size={24} color="#D4AF37" />
                            <Text className="text-white text-base">Current Streak</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-primaryGold text-2xl font-bold">{currentStreak}</Text>
                            <Text className="text-mutedWhite text-sm">days</Text>
                        </View>
                    </View>
                    <Text className="text-mutedWhite text-xs mt-2">
                        Your notifications will be personalized with your streak!
                    </Text>
                </View>

                {/* Enable/Disable Toggle */}
                <View className="mx-5 mb-6">
                    <View className="bg-surfaceBlack rounded-2xl border border-borderDark p-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center gap-3">
                                <MaterialIcons
                                    name={notificationsEnabled ? "notifications-active" : "notifications-off"}
                                    size={24}
                                    color={notificationsEnabled ? "#D4AF37" : "rgba(255,255,255,0.42)"}
                                />
                                <Text className="text-white text-base font-semibold">
                                    Daily Reminders
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleToggleNotifications}
                                trackColor={{ false: '#1F1F1F', true: '#D4AF37' }}
                                thumbColor={notificationsEnabled ? '#F1E5AC' : '#f4f3f4'}
                            />
                        </View>
                        <Text className="text-mutedWhite text-xs">
                            {notificationsEnabled
                                ? 'You will receive daily reminders'
                                : 'Enable to receive daily reminders'}
                        </Text>

                        {/* Permission Status */}
                        {notificationsEnabled && (
                            <View className="mt-3 pt-3 border-t border-borderDark">
                                <View className="flex-row items-center gap-2">
                                    <View className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <Text className="text-mutedWhite text-xs">
                                        {hasPermission ? 'Permissions granted' : 'Permissions required'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Time Selection */}
                {notificationsEnabled && (
                    <View className="mx-5 mb-6">
                        <Text className="text-white text-base font-semibold mb-3">
                            Reminder Time
                        </Text>
                        <Text className="text-mutedWhite text-sm mb-4">
                            Choose when you'd like to receive your daily reminder
                        </Text>

                        {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => handleTimeSelect(option.id)}
                                activeOpacity={0.7}
                                className={`mb-3 p-4 rounded-2xl border ${
                                    selectedTime === option.id
                                        ? 'bg-primaryGold/10 border-primaryGold'
                                        : 'bg-surfaceBlack border-borderDark'
                                }`}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <MaterialIcons
                                            name={option.icon}
                                            size={28}
                                            color={selectedTime === option.id ? '#D4AF37' : 'rgba(255,255,255,0.42)'}
                                        />
                                        <View>
                                            <Text className={`text-base font-semibold ${
                                                selectedTime === option.id ? 'text-primaryGold' : 'text-white'
                                            }`}>
                                                {option.label}
                                            </Text>
                                            <Text className="text-mutedWhite text-sm">
                                                {option.time}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Radio button */}
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                                        selectedTime === option.id
                                            ? 'border-primaryGold'
                                            : 'border-borderDark'
                                    }`}>
                                        {selectedTime === option.id && (
                                            <View className="w-3 h-3 rounded-full bg-primaryGold" />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Test Button */}
                {notificationsEnabled && hasPermission && (
                    <View className="mx-5 mb-6">
                        <TouchableOpacity
                            onPress={handleTestNotification}
                            activeOpacity={0.7}
                            className="bg-mutedBlack border border-primaryGold/30 py-3 px-4 rounded-xl"
                        >
                            <Text className="text-center text-primaryGold font-semibold">
                                🧪 Test Notification (5 seconds)
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Save Button */}
                {notificationsEnabled && (
                    <View className="mx-5 mb-10">
                        <TouchableOpacity
                            onPress={handleSaveSettings}
                            disabled={isSaving}
                            activeOpacity={0.7}
                            className={`py-4 px-6 rounded-xl ${
                                isSaving ? 'bg-primaryGold/50' : 'bg-primaryGold'
                            }`}
                        >
                            <Text className="text-center text-black text-base font-bold">
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Section */}
                <View className="mx-5 mb-10 p-4 bg-surfaceBlack/50 rounded-2xl border border-borderDark">
                    <Text className="text-mutedWhite text-xs leading-5">
                        💡 <Text className="font-semibold">Tip:</Text> Your preferences are saved automatically. Notifications will be personalized based on your current streak!
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationSettings;
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, ActivityIndicator, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import * as NotificationManager from '@/services/NotificationManager';
import * as DatabaseManager from '@/utils/DatabaseManager';
import { useTranslation } from 'react-i18next';

const NotificationSettings = () => {
    const router = useRouter();
    const { t } = useTranslation();

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [selectedTime, setSelectedTime] = useState('evening');
    const [currentStreak, setCurrentStreak] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Time Options using translation keys
    const TIME_OPTIONS = [
        { id: 'morning', label: t('morning'), time: '8:00 AM', hour: 8, minute: 0, icon: 'wb-sunny' },
        { id: 'afternoon', label: t('afternoon'), time: '2:00 PM', hour: 14, minute: 0, icon: 'wb-twilight' },
        { id: 'evening', label: t('evening'), time: '8:00 PM', hour: 20, minute: 0, icon: 'nights-stay' },
    ];

    useEffect(() => {
        initializeSettings();
    }, []);

    const initializeSettings = async () => {
        setIsLoading(true);
        try {
            const savedSettings = await DatabaseManager.getSettings();
            if (savedSettings) {
                setNotificationsEnabled(savedSettings.notification_enabled === 1);
                setSelectedTime(savedSettings.notification_time || 'evening');
            }

            const granted = await NotificationManager.hasPermissions();
            setHasPermission(granted);

            const streakData = await DatabaseManager.getStreak();
            if (streakData) {
                setCurrentStreak(streakData.count);
            }
        } catch (error) {
            console.error('Failed to initialize settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleNotifications = async (value: boolean) => {
        if (value) {
            if (!hasPermission) {
                const granted = await NotificationManager.requestPermissions();
                if (!granted) {
                    Alert.alert(t('permissionDenied'), t('enableInSettings'));
                    return;
                }
                setHasPermission(true);
            }
            setNotificationsEnabled(true);
            updateDBSettings(1);
        } else {
            await NotificationManager.cancelAllNotifications();
            setNotificationsEnabled(false);
            updateDBSettings(0);
            Alert.alert(t('notifDisabled'), t('notifDisabledDesc'));
        }
    };

    const updateDBSettings = async (enabled: number) => {
        const timeOption = TIME_OPTIONS.find(opt => opt.id === selectedTime);
        if (timeOption) {
            await DatabaseManager.updateSettings({
                notification_enabled: enabled,
                notification_time: selectedTime,
                notification_hour: timeOption.hour,
                notification_minute: timeOption.minute
            });
        }
    };

    const handleSaveSettings = async () => {
        if (!notificationsEnabled) return;

        setIsSaving(true);
        try {
            const timeOption = TIME_OPTIONS.find(opt => opt.id === selectedTime);
            if (!timeOption) throw new Error('Invalid time selection');

            const notificationId = await NotificationManager.scheduleDailyReminder(
                timeOption.hour,
                timeOption.minute
            );

            if (!notificationId) throw new Error('Failed');

            await DatabaseManager.updateSettings({
                notification_enabled: 1,
                notification_time: selectedTime,
                notification_hour: timeOption.hour,
                notification_minute: timeOption.minute
            });

            Alert.alert(
                t('settingsSaved'),
                t('settingsSavedDesc', { time: timeOption.time }),
                [{ text: t('confirm'), onPress: () => router.back() }]
            );

        } catch (error) {
            Alert.alert('Error', 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-matteBlack">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#D4AF37" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-matteBlack">
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: t('notifications'),
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
                        {t('dailyWerdReminders')}
                    </Text>
                    <Text className="text-center text-mutedWhite text-sm">
                        {t('stayConsistent')}
                    </Text>
                </View>

                {/* Current Streak Display */}
                <View className="mx-5 mb-6 p-4 bg-surfaceBlack rounded-2xl border border-primaryGold/30">
                    <View className={`flex-row items-center justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                        <View className="flex-row items-center gap-3">
                            <MaterialIcons name="local-fire-department" size={24} color="#D4AF37" />
                            <Text className="text-white text-base">{t('currentStreak')}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-primaryGold text-2xl font-bold">{currentStreak}</Text>
                            <Text className="text-mutedWhite text-sm">{t('days')}</Text>
                        </View>
                    </View>
                    <Text className={`text-mutedWhite text-xs mt-2 ${I18nManager.isRTL ? 'text-right' : ''}`}>
                        {t('notifTip')}
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
                                    {t('dailyWerd')}
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleToggleNotifications}
                                trackColor={{ false: '#1F1F1F', true: '#D4AF37' }}
                                thumbColor={notificationsEnabled ? '#F1E5AC' : '#f4f3f4'}
                            />
                        </View>

                        {notificationsEnabled && (
                            <View className="mt-3 pt-3 border-t border-borderDark">
                                <View className={`flex-row items-center gap-2 ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                                    <View className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <Text className="text-mutedWhite text-xs">
                                        {hasPermission ? t('permissionsGranted') : t('permissionsRequired')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Time Selection */}
                {notificationsEnabled && (
                    <View className="mx-5 mb-6">
                        <Text className={`text-white text-base font-semibold mb-3 ${I18nManager.isRTL ? 'text-right' : ''}`}>
                            {t('reminderTime')}
                        </Text>
                        <Text className={`text-mutedWhite text-sm mb-4 ${I18nManager.isRTL ? 'text-right' : ''}`}>
                            {t('chooseTime')}
                        </Text>

                        {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedTime(option.id)}
                                activeOpacity={0.7}
                                className={`mb-3 p-4 rounded-2xl border ${
                                    selectedTime === option.id
                                        ? 'bg-primaryGold/10 border-primaryGold'
                                        : 'bg-surfaceBlack border-borderDark'
                                }`}
                            >
                                <View className={`flex-row items-center justify-between ${I18nManager.isRTL ? 'flex-row-reverse' : ''}`}>
                                    <View className="flex-row items-center gap-3">
                                        <MaterialIcons
                                            name={option.icon}
                                            size={28}
                                            color={selectedTime === option.id ? '#D4AF37' : 'rgba(255,255,255,0.42)'}
                                        />
                                        <View>
                                            <Text className={`text-base font-semibold ${
                                                selectedTime === option.id ? 'text-primaryGold' : 'text-white'
                                            } ${I18nManager.isRTL ? 'text-right' : ''}`}>
                                                {option.label}
                                            </Text>
                                            <Text className={`text-mutedWhite text-sm ${I18nManager.isRTL ? 'text-right' : ''}`}>
                                                {option.time}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Radio button circle */}
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                                        selectedTime === option.id ? 'border-primaryGold' : 'border-borderDark'
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

                {/* Save Button */}
                {notificationsEnabled && (
                    <View className="mx-5 mb-10">
                        <TouchableOpacity
                            onPress={handleSaveSettings}
                            disabled={isSaving}
                            activeOpacity={0.7}
                            className={`py-4 px-6 rounded-xl ${isSaving ? 'bg-primaryGold/50' : 'bg-primaryGold'}`}
                        >
                            <Text className="text-center text-black text-base font-bold">
                                {isSaving ? t('saving') : t('saveSettings')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Section */}
                <View className="mx-5 mb-10 p-4 bg-surfaceBlack/50 rounded-2xl border border-borderDark">
                    <Text className={`text-mutedWhite text-xs leading-5 ${I18nManager.isRTL ? 'text-right' : ''}`}>
                        💡 <Text className="font-semibold">{t('tip')}:</Text> {t('notifTip')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationSettings;
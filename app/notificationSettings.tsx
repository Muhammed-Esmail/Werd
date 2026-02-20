import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, ActivityIndicator, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import * as NotificationManager from '@/services/NotificationManager';
import * as DatabaseManager from '@/utils/DatabaseManager';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';

const NotificationSettings = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [selectedTime, setSelectedTime] = useState('evening');
    const [currentStreak, setCurrentStreak] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isDark = colorScheme === 'dark';

    // Theme tokens
    const theme = {
        bg: isDark ? '#0A0A0A' : '#FFFFFF',
        surface: isDark ? '#1A1A1A' : '#F5F5F5',
        surfaceAlt: isDark ? 'rgba(26,26,26,0.5)' : 'rgba(245,245,245,0.8)',
        border: isDark ? '#2A2A2A' : '#EEEEEE',
        borderGold: isDark ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.2)',
        text: isDark ? '#FFFFFF' : '#D4AF37',
        textMuted: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(212,175,55,0.6)',
        gold: isDark ? '#D4AF37' : '#D4AF37',
        goldBg: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.08)',
        headerBg: isDark ? '#0A0A0A' : '#FFFFFF',
        headerTint: isDark ? '#D4AF37' : '#D4AF37',
        switchTrackOff: isDark ? '#1F1F1F' : '#E0E0E0',
        switchTrackOn: isDark ? '#D4AF37' : '#D4AF37',
        switchThumbOn: isDark ? '#F1E5AC' : '#F1E5AC',
        switchThumbOff: isDark ? '#f4f3f4' : '#FFFFFF',
        iconOff: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(212,175,55,0.4)',
        saveBtn: isDark ? '#D4AF37' : '#D4AF37',
        saveBtnDisabled: isDark ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.4)',
        saveBtnText: isDark ? '#000000' : '#000000',
    };

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
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.gold} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView style={{ flex: 1 }}>
                {/* Header Section */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        <MaterialIcons name="notifications-active" size={48} color={theme.gold} />
                    </View>
                    <Text style={{ textAlign: 'center', color: theme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                        {t('dailyWerdReminders')}
                    </Text>
                    <Text style={{ textAlign: 'center', color: theme.textMuted, fontSize: 14 }}>
                        {t('stayConsistent')}
                    </Text>
                </View>

                {/* Current Streak Display */}
                <View style={{ marginHorizontal: 20, marginBottom: 24, padding: 16, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.borderGold }}>
                    <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <MaterialIcons name="local-fire-department" size={24} color={theme.gold} />
                            <Text style={{ color: theme.text, fontSize: 16 }}>{t('currentStreak')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: theme.gold, fontSize: 24, fontWeight: 'bold' }}>{currentStreak}</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('days')}</Text>
                        </View>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8, textAlign: I18nManager.isRTL ? 'right' : 'left' }}>
                        {t('notifTip')}
                    </Text>
                </View>

                {/* Enable/Disable Toggle */}
                <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
                    <View style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialIcons
                                    name={notificationsEnabled ? "notifications-active" : "notifications-off"}
                                    size={24}
                                    color={notificationsEnabled ? theme.gold : theme.iconOff}
                                />
                                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>
                                    {t('dailyWerd')}
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleToggleNotifications}
                                trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                                thumbColor={notificationsEnabled ? theme.switchThumbOn : theme.switchThumbOff}
                            />
                        </View>

                        {notificationsEnabled && (
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                                <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hasPermission ? '#22c55e' : '#ef4444' }} />
                                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                                        {hasPermission ? t('permissionsGranted') : t('permissionsRequired')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Time Selection */}
                {notificationsEnabled && (
                    <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: I18nManager.isRTL ? 'right' : 'left' }}>
                            {t('reminderTime')}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 14, marginBottom: 16, textAlign: I18nManager.isRTL ? 'right' : 'left' }}>
                            {t('chooseTime')}
                        </Text>

                        {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedTime(option.id)}
                                activeOpacity={0.7}
                                style={{
                                    marginBottom: 12,
                                    padding: 16,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    backgroundColor: selectedTime === option.id ? theme.goldBg : theme.surface,
                                    borderColor: selectedTime === option.id ? theme.gold : theme.border,
                                }}
                            >
                                <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <MaterialIcons
                                            name={option.icon}
                                            size={28}
                                            color={selectedTime === option.id ? theme.gold : theme.iconOff}
                                        />
                                        <View>
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: selectedTime === option.id ? theme.gold : theme.text,
                                                textAlign: I18nManager.isRTL ? 'right' : 'left',
                                            }}>
                                                {option.label}
                                            </Text>
                                            <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: I18nManager.isRTL ? 'right' : 'left' }}>
                                                {option.time}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Radio button circle */}
                                    <View style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderColor: selectedTime === option.id ? theme.gold : theme.border,
                                    }}>
                                        {selectedTime === option.id && (
                                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.gold }} />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Save Button */}
                {notificationsEnabled && (
                    <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
                        <TouchableOpacity
                            onPress={handleSaveSettings}
                            disabled={isSaving}
                            activeOpacity={0.7}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 24,
                                borderRadius: 12,
                                backgroundColor: isSaving ? theme.saveBtnDisabled : theme.saveBtn,
                            }}
                        >
                            <Text style={{ textAlign: 'center', color: theme.saveBtnText, fontSize: 16, fontWeight: 'bold' }}>
                                {isSaving ? t('saving') : t('saveSettings')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Section */}
                <View style={{ marginHorizontal: 20, marginBottom: 40, padding: 16, backgroundColor: theme.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 20, textAlign: I18nManager.isRTL ? 'right' : 'left' }}>
                        💡 <Text style={{ fontWeight: '600' }}>{t('tip')}:</Text> {t('notifTip')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationSettings;
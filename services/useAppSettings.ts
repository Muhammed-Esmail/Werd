import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import * as DB from '@/utils/DatabaseManager';
import i18n from '@/i18n';

export interface UserSettings {
    font: string;
    font_size: number;
    reading_mode: number;
    partition_type: number;
    starting_date: string;
    ending_date: string;
    theme: number;
    language: string;
    currentWerd: number;
}

export const useAppSettings = () => {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const { setColorScheme } = useColorScheme();

    // Load settings from DB
    const loadSettings = useCallback(async () => {
        try {
            const dbSettings = await DB.getSettings() as unknown as UserSettings;
            setSettings(dbSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // ==========================================
    // UPDATE METHODS
    // ==========================================

    const updateFont = useCallback(async (font: string) => {
        try {
            await DB.updateSettings({ font });
            setSettings(prev => prev ? { ...prev, font } : null);
            console.log('✅ Font updated to:', font);
            return true;
        } catch (error) {
            console.error('Error updating font:', error);
            return false;
        }
    }, []);

    const updateFontSize = useCallback(async (fontSize: number) => {
        try {
            await DB.updateSettings({ font_size: fontSize });
            setSettings(prev => prev ? { ...prev, font_size: fontSize } : null);
            return true;
        } catch (error) {
            console.error('Error updating font size:', error);
            return false;
        }
    }, []);

    const updateTheme = useCallback(async (theme: number) => {
        try {
            await DB.updateSettings({ theme });
            setColorScheme(theme === 0 ? 'dark' : 'light');
            setSettings(prev => prev ? { ...prev, theme } : null);
            console.log('✅ Theme updated to:', theme === 0 ? 'dark' : 'light');
            return true;
        } catch (error) {
            console.error('Error updating theme:', error);
            return false;
        }
    }, [setColorScheme]);

    const toggleTheme = useCallback(async () => {
        const newTheme = settings?.theme === 0 ? 1 : 0;
        return await updateTheme(newTheme);
    }, [settings?.theme, updateTheme]);

    const updateReadingMode = useCallback(async (mode: number) => {
        try {
            await DB.updateSettings({ reading_mode: mode });
            setSettings(prev => prev ? { ...prev, reading_mode: mode } : null);
            return true;
        } catch (error) {
            console.error('Error updating reading mode:', error);
            return false;
        }
    }, []);

    const toggleReadingMode = useCallback(async () => {
        const newMode = settings?.reading_mode === 0 ? 1 : 0;
        return await updateReadingMode(newMode);
    }, [settings?.reading_mode, updateReadingMode]);

    const updateLanguage = useCallback(async (lang: string, shouldReload: boolean = true) => {
        try {
            await DB.updateSettings({ language: lang });
            await i18n.changeLanguage(lang);
            
            I18nManager.allowRTL(lang === 'ar');
            I18nManager.forceRTL(lang === 'ar');
            
            setSettings(prev => prev ? { ...prev, language: lang } : null);
            
            if (shouldReload) {
                await Updates.reloadAsync();
            }
            
            return true;
        } catch (error) {
            console.error('Error updating language:', error);
            return false;
        }
    }, []);

    const updateCurrentWerd = useCallback(async (werdNumber: number) => {
        try {
            await DB.updateSettings({ currentWerd: werdNumber });
            setSettings(prev => prev ? { ...prev, currentWerd: werdNumber } : null);
            return true;
        } catch (error) {
            console.error('Error updating current werd:', error);
            return false;
        }
    }, []);

    const updateWerdDates = useCallback(async (startDate: string, endDate: string) => {
        try {
            await DB.updateSettings({ 
                starting_date: startDate,
                ending_date: endDate 
            });
            setSettings(prev => prev ? { 
                ...prev, 
                starting_date: startDate,
                ending_date: endDate 
            } : null);
            return true;
        } catch (error) {
            console.error('Error updating werd dates:', error);
            return false;
        }
    }, []);

    const updatePartitionType = useCallback(async (type: number) => {
        try {
            // @ts-ignore
            await DB.updateSettings({ partition_type: type });
            setSettings(prev => prev ? { ...prev, partition_type: type } : null);
            return true;
        } catch (error) {
            console.error('Error updating partition type:', error);
            return false;
        }
    }, []);

    const refresh = useCallback(async () => {
        await loadSettings();
    }, [loadSettings]);

    const updateMultiple = useCallback(async (updates: Partial<UserSettings>) => {
        try {
            await DB.updateSettings(updates as any);
            setSettings(prev => prev ? { ...prev, ...updates } : null);
            
            if ('theme' in updates && updates.theme !== undefined) {
                setColorScheme(updates.theme === 0 ? 'dark' : 'light');
            }
            
            return true;
        } catch (error) {
            console.error('Error batch updating settings:', error);
            return false;
        }
    }, [setColorScheme]);

    // ==========================================
    // SAFE GETTERS - Return actual values or null
    // Components should handle loading state
    // ==========================================
    
    return {
        // Current settings
        settings,
        loading,
        
        // CHANGED: Return actual values from settings, or null if not loaded
        // This way components know when data isn't ready yet
        font: settings?.font ?? null,
        fontSize: settings?.font_size ?? null,
        theme: settings?.theme ?? null,
        readingMode: settings?.reading_mode ?? null,
        language: settings?.language ?? null,
        currentWerd: settings?.currentWerd ?? null,
        partitionType: settings?.partition_type ?? null,
        startingDate: settings?.starting_date ?? null,
        endingDate: settings?.ending_date ?? null,
        
        // Boolean helpers - null-safe
        isDarkMode: settings?.theme === 0,
        isLightMode: settings?.theme === 1,
        isScrollMode: settings?.reading_mode === 0,
        isPageMode: settings?.reading_mode === 1,
        isArabic: settings?.language === 'ar',
        isEnglish: settings?.language === 'en',
        
        // Update methods
        updateFont,
        updateFontSize,
        updateTheme,
        toggleTheme,
        updateReadingMode,
        toggleReadingMode,
        updateLanguage,
        updateCurrentWerd,
        updateWerdDates,
        updatePartitionType,
        updateMultiple,
        
        // Utility
        refresh,
    };
};
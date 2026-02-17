import { FlatList, Modal, ScrollView, StyleSheet, Image, Switch, Text, TouchableOpacity, View, Pressable, I18nManager, Dimensions, useColorScheme as useRNColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import * as DB from '../../utils/DatabaseManager'
import { useColorScheme } from "nativewind";
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import '../../i18n';
import i18n from '../../i18n';
import { SelectList } from 'react-native-dropdown-select-list'
import { devs } from '@/types/devs';

interface UserSettings {
    font?: string;
    font_size: number;
    reading_mode: number;
    partition_type: number;
    starting_date: string;
    ending_date: string;
    theme: number;
    language: string;
    currentWerd: number;
}

const OPTIONS = [
    {id: 1, text: 'goal', path: "goalSetup", icon: "book"},
    {id: 2, text: "notifications", path: "/notificationSettings", icon: "notifications"},
    {id: 3, text: "fonts", path: null, icon: "pencil"},
    {id: 4, text: "darkMode", path: null, icon: "contrast"},
    {id: 5, text: "readingMode", path: null, icon: "book"},
    {id: 6, text: "language", path: null, icon: "language"},
    {id: 7, text: "About Us", path: null, icon: "information-circle-outline"}
]

const FONT_OPTIONS = [
    'Amiri-Bold', 'Amiri-BoldItalic', 'Amiri-Italic', 'Amiri-Regular',
    'D1', 'D2', 'HAFS', 'J1', 'J2', 'Q1', 'U3',
    'UthmanTN1-Ver10', 'UthmanTN_v2-0'
]

const LANGUAGE_CHOICES = [
    {key: 'en', value: 'english'},
    {key: 'ar', value: 'arabic'}
]

// Component name must be PascalCase (Settings, not settings)
const Settings = () => {
    const { setColorScheme } = useColorScheme();
    const colorScheme = useRNColorScheme();
    const { t } = useTranslation();
    const router = useRouter();
    const [fontModalVisible, setFontModalVisible] = useState<boolean>(false)
    const [readingModalVisible, setReadingModalVisible] = useState<boolean>(false)
    const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false)
    const [readingMode, setReadingMode] = useState<boolean>(false)
    const [isEnabled, setIsEnabled] = useState(false);
    const [selectedLang, setSelectedLang] = React.useState("");

    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    const renderOption = ({ item }: any) => {
        return (
            <TouchableOpacity onPress={() => {
                if (item.id === 3) setFontModalVisible(true)
                else if (item.id === 5) setReadingModalVisible(true)
                else if (item.id === 7) setAboutModalVisible(true)
                // @ts-ignore
                else if (item.path) router.push(item.path)
            }}>
                <View className="flex-row items-center justify-between p-4 mb-3 bg-gray-100 dark:bg-surfaceBlack rounded-2xl border border-settingsGold/20 dark:border-settingsGold/30">
                    <View className="flex-row items-center">
                        <Ionicons name={item.icon} size={22} color="#D4AF37" />
                        <Text className="text-black dark:text-white text-base font-medium ml-4">{t(item.text)}</Text>
                    </View>
                    {item.id === 4 && 
                        <Switch
                            trackColor={{false: '#767577', true: '#D4AF37'}}
                            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                            onValueChange={async () => {
                                toggleSwitch()
                                let val = isEnabled ? 1 : 0
                                setColorScheme(val === 0 ? "dark" : "light")
                                await DB.updateSettings({theme: val})
                            }}
                            value={isEnabled}
                        />
                    }
                    {item.id === 6 && 
                        <SelectList 
                            setSelected={async (val: string) => {
                                if (val !== selectedLang) {
                                    let lang = val === "arabic" ? "ar" : "en"
                                    setSelectedLang(lang)
                                    await changeLang(lang)
                                }
                            }} 
                            data={LANGUAGE_CHOICES} 
                            save="value"
                            boxStyles={{
                                backgroundColor: colorScheme === 'dark' ? '#121212' : '#F3F4F6',
                                borderColor: colorScheme === 'dark' ? 'rgba(197, 160, 89, 0.3)' : 'rgba(197, 160, 89, 0.2)',
                                borderRadius: 16,
                                paddingVertical: 14,
                            }}
                            inputStyles={{ color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', fontWeight: '500' }}
                            placeholder={t('selectLanguage')}
                        />
                    }
                    {item.id !== 4 && item.id !==6 && <MaterialIcons name="chevron-right" size={20} color={colorScheme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />}
                </View>
            </TouchableOpacity>
        );
    };

    const changeLang = async (lang: string = "en", startup: boolean = false) => {
        await i18n.changeLanguage(lang)
        if (!startup) {
            await DB.updateSettings({language: lang})
            if ((selectedLang === "en" && lang === "ar") || (selectedLang === "ar" && lang === "en")) {
                I18nManager.allowRTL(lang === "ar");
                I18nManager.forceRTL(lang === "ar");
            }
            await Updates.reloadAsync();
        }
    }

    useEffect(() => {
        const init = async () => {
            // @ts-ignore
            const current_settings = await DB.getSettings() as UserSettings
            if(!current_settings) return;
            setIsEnabled(current_settings.theme === 0)
            setColorScheme(current_settings.theme === 0 ? "dark" : "light")
            setReadingMode(current_settings.reading_mode === 1)
            changeLang(current_settings.language, true)
        };
        init();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-matteBlack">
            <View className="flex-1">
                <View className="mb-8 mt-2">
                    <View className='w-[100%] justify-center items-center'>
                        <Text className='text-primaryGold mt-8 text-xl font-bold'> {t("settings")} </Text>
                    </View>
                    <View className='w-[100%] justify-center items-center'>
                        <Text className="text-gray-500 dark:text-light-300 text-sm mt-1 text-center">{t('customize')}</Text>
                    </View>
                </View>

                <FlatList data={OPTIONS} renderItem={renderOption} keyExtractor={(item) => item.id.toString()} className='px-5' />

                {/* About Modal */}
                <Modal animationType="slide" transparent={true} visible={aboutModalVisible} statusBarTranslucent={true} onRequestClose={() => setAboutModalVisible(false)}>
                    <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setAboutModalVisible(false)}>
                        <View className="bg-bgWhite dark:bg-surfaceBlack rounded-t-[40px] p-8 border-t border-settingsGold/50" onStartShouldSetResponder={() => true}>
                            <View className="w-12 h-1 bg-gray-300 dark:bg-white/10 rounded-full self-center mb-6" />
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-primaryGold text-2xl font-bold">{t('About Us')}</Text>
                                <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                                    <Ionicons name="close-circle" size={28} color={colorScheme === 'dark' ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-gray-600 dark:text-mutedWhite mb-8 text-center text-base leading-6">
                                This app was born from a simple desire to make the Quran a daily companion. We're a group of developers building for the sake of Allah, and we pray it brings you closer to His words.
                            </Text>
                            <View className="gap-y-3 pb-10">
                                {devs.map((name, index) => (
                                    <View key={index} className="p-4 bg-gray-50 dark:bg-matteBlack rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                                        <Text className="text-black dark:text-white text-right text-lg font-medium">{name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Pressable>
                </Modal>

                {/* Font Modal */}
                <Modal animationType="slide" transparent={true} visible={fontModalVisible} statusBarTranslucent={true} onRequestClose={() => setFontModalVisible(false)}>
                    <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setFontModalVisible(false)}>
                        <View className="bg-bgWhite dark:bg-surfaceBlack rounded-t-[40px] p-8 pb-4 border-t border-settingsGold/50" onStartShouldSetResponder={() => true}>
                            <View className="w-12 h-1 bg-gray-300 dark:bg-white/10 rounded-full self-center mb-4" />
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-primaryGold text-2xl font-bold">Select Font</Text>
                                <TouchableOpacity onPress={() => setFontModalVisible(false)}>
                                    <Ionicons name="close-circle" size={28} color={colorScheme === 'dark' ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView className="max-h-[75%] mb-4">
                                {FONT_OPTIONS.map((font) => (
                                    <TouchableOpacity key={font} className="p-5 mb-3 bg-gray-50 dark:bg-matteBlack rounded-2xl border border-black/5 dark:border-white/5"
                                        onPress={async () => {
                                            await DB.updateSettings({font: font});
                                            setFontModalVisible(false);
                                        }}>
                                        <Text className="text-black dark:text-white text-right text-xl" style={{fontFamily: font}}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                                        <Text className="text-settingsGold/60 text-xs mt-1 uppercase tracking-widest">{font}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Modal>

                {/* Reading Mode Modal */}
                <Modal animationType="slide" transparent={true} visible={readingModalVisible} statusBarTranslucent={true} onRequestClose={() => setReadingModalVisible(false)}>
                    <Pressable className="flex-1 bg-black/70 justify-end" onPress={() => setReadingModalVisible(false)}>
                        <Pressable className="bg-white dark:bg-surfaceBlack rounded-t-[40px] p-8 border-t border-settingsGold/30" onPress={(e) => e.stopPropagation()}>
                            <View className="w-12 h-1 bg-gray-300 dark:bg-white/10 rounded-full self-center mb-6" />
                            <Text className="text-black dark:text-white text-2xl font-bold text-center mb-10">Reading Mode</Text>
                            <View className="flex-row justify-between">
                                <TouchableOpacity onPress={() => setReadingMode(false)} className="items-center w-[46%]">
                                    <View style={{ borderColor: readingMode === false ? '#D4AF37' : 'transparent', backgroundColor: readingMode === false ? undefined : colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }} className="w-full aspect-[3/4] rounded-3xl overflow-hidden border-4">
                                        <Image source={require('../../assets/images/scroll-preview.jpg')} style={{ opacity: readingMode === false ? 1 : 0.4 }} className="w-full h-full" resizeMode="cover" />
                                    </View>
                                    <Text style={{ color: readingMode === false ? '#D4AF37' : colorScheme === 'dark' ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }} className="mt-4 text-lg font-bold">{t('scroll')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setReadingMode(true)} className="items-center w-[46%]">
                                    <View style={{ borderColor: readingMode === true ? '#D4AF37' : 'transparent', backgroundColor: readingMode === true ? undefined : colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }} className="w-full aspect-[3/4] rounded-3xl overflow-hidden border-4">
                                        <Image source={require('../../assets/images/pages-preview.jpg')} style={{ opacity: readingMode === true ? 1 : 0.4 }} className="w-full h-full" resizeMode="cover" />
                                    </View>
                                    <Text style={{ color: readingMode === true ? '#D4AF37' : colorScheme === 'dark' ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }} className="mt-4 text-lg font-bold">{t('pages')}</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={async () => {
                                await DB.updateSettings({reading_mode: readingMode ? 1 : 0})
                                setReadingModalVisible(false)
                            }} className="mt-12 bg-settingsGold py-5 rounded-2xl items-center shadow-md">
                                <Text className="text-matteBlack font-bold text-lg">{t('confirm')}</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        </SafeAreaView>
    )
}

export default Settings
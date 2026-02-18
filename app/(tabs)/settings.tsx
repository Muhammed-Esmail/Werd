import { FlatList, Modal, ScrollView, Image, Switch, Text, TouchableOpacity, View, Pressable, I18nManager, useColorScheme as useRNColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import * as DB from '../../utils/DatabaseManager'
import { useColorScheme } from "nativewind";
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import i18n from '../../i18n';
import { SelectList } from 'react-native-dropdown-select-list'
import { devs } from '@/types/devs';

interface UserSettings {
    font?: string;
    language: string;
    theme: number;
    reading_mode: number;
}

const Settings = () => {
    const { setColorScheme } = useColorScheme();
    const colorScheme = useRNColorScheme();
    const { t } = useTranslation();
    const router = useRouter();

    const [fontModalVisible, setFontModalVisible] = useState(false)
    const [readingModalVisible, setReadingModalVisible] = useState(false)
    const [aboutModalVisible, setAboutModalVisible] = useState(false)
    const [readingMode, setReadingMode] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false);

    const OPTIONS = [
        {id: 1, text: 'goal', path: "goalSetup", icon: "book-outline"},
        {id: 2, text: "notifications", path: "/notificationSettings", icon: "notifications-outline"},
        {id: 3, text: "fonts", path: null, icon: "text-outline"},
        {id: 4, text: "darkMode", path: null, icon: "contrast-outline"},
        {id: 5, text: "readingMode", path: null, icon: "reader-outline"},
        {id: 6, text: "language", path: null, icon: "language-outline"},
        {id: 7, text: "aboutUs", path: null, icon: "information-circle-outline"}
    ]

    const LANGUAGE_CHOICES = [
        {key: 'en', value: 'English'},
        {key: 'ar', value: 'Arabic'}
    ]

    const FONT_OPTIONS = ['Amiri-Regular', 'HAFS', 'UthmanTN_v2-0', 'D1', 'Q1'];

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await DB.getSettings() as UserSettings;
            if (settings) {
                setIsDarkMode(settings.theme === 0);
                setReadingMode(settings.reading_mode === 1);
            }
        };
        loadSettings();
    }, []);

    const changeLang = async (lang: string) => {
        await i18n.changeLanguage(lang);
        const isRTL = lang === 'ar';
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        await DB.updateSettings({language: lang})
        await (async () => {
            return await Updates.reloadAsync();
        })();
    }

    const renderOption = ({ item }: any) => (
        <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => {
                if (item.id === 3) setFontModalVisible(true)
                else if (item.id === 5) setReadingModalVisible(true)
                else if (item.id === 7) setAboutModalVisible(true)
                else if (item.path) router.push(item.path)
            }}
        >
            <View className="flex-row items-center justify-between p-4 mb-3 bg-gray-100 dark:bg-surfaceBlack rounded-2xl border border-settingsGold/10">
                <View className="flex-row items-center">
                    <Ionicons name={item.icon} size={22} color="#D4AF37" />
                    <Text className="text-black dark:text-white text-base font-medium ml-4 mr-4">{t(item.text)}</Text>
                </View>

                {item.id === 4 ? (
                    <Switch
                        trackColor={{false: '#767577', true: '#D4AF37'}}
                        thumbColor={isDarkMode ? '#FFFFFF' : '#f4f3f4'}
                        onValueChange={async (value) => {
                            setIsDarkMode(value);
                            const themeVal = value ? 0 : 1;
                            setColorScheme(value ? "dark" : "light");
                            await DB.updateSettings({ theme: themeVal });
                        }}
                        value={isDarkMode}
                    />
                ) : item.id === 6 ? (
                    <View className="w-32">
                        <SelectList 
                            setSelected={(val: string) => {
                                const lang = LANGUAGE_CHOICES.find(l => l.value === val);
                                if (lang) changeLang(lang.key);
                            }} 
                            data={LANGUAGE_CHOICES} 
                            save="value"
                            search={false}
                            placeholder={i18n.language === 'ar' ? 'Arabic' : 'English'}
                            boxStyles={{ borderRadius: 10, borderWidth: 0, paddingVertical: 5, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                            inputStyles={{ color: '#D4AF37', fontSize: 12, fontWeight: 'bold' }}
                            dropdownStyles={{ backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFF' }}
                        />
                    </View>
                ) : (
                    <MaterialIcons 
                        name={I18nManager.isRTL ? "chevron-left" : "chevron-right"} 
                        size={20} 
                        color="gray" 
                    />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-matteBlack">
            <View className="px-5 flex-1">
                <View className="items-center mb-8 mt-4">
                    <Text className="text-primaryGold text-2xl font-bold">{t("settings")}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('customize')}</Text>
                </View>

                <FlatList 
                    data={OPTIONS} 
                    renderItem={renderOption} 
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                />

                {/* About Modal */}
                <Modal visible={aboutModalVisible} transparent animationType="slide">
                    <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setAboutModalVisible(false)}>
                        <View className="bg-white dark:bg-surfaceBlack rounded-t-[40px] p-8">
                            <Text className="text-primaryGold text-2xl font-bold mb-4">{t('aboutUs')}</Text>
                            <Text className="text-gray-600 dark:text-mutedWhite text-base mb-6 leading-6">
                                {t('aboutDescription')}
                            </Text>
                            <View className="gap-y-3 pb-10">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <View key={num} className="p-4 bg-gray-50 dark:bg-matteBlack rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                                        <Text className="text-black dark:text-white text-center text-lg font-medium">
                                            {t(`devs.dev${num}`)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Pressable>
                </Modal>

                {/* Font Modal */}
                <Modal visible={fontModalVisible} transparent animationType="slide">
                    <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setFontModalVisible(false)}>
                        <View className="bg-white dark:bg-surfaceBlack rounded-t-[40px] p-8 max-h-[80%]">
                            <Text className="text-primaryGold text-xl font-bold mb-4">{t('selectFont')}</Text>
                            <ScrollView>
                                {FONT_OPTIONS.map((font) => (
                                    <TouchableOpacity key={font} className="p-4 mb-2 border-b border-gray-100 dark:border-white/5" 
                                        onPress={async () => {
                                            await DB.updateSettings({font});
                                            setFontModalVisible(false);
                                        }}>
                                        <Text style={{fontFamily: font}} className="text-right text-lg dark:text-white">بسم الله الرحمن الرحيم</Text>
                                        <Text className="text-xs text-gray-400">{font}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Modal>
                
                {/* Reading Mode Modal */}
                <Modal visible={readingModalVisible} transparent animationType="slide">
                    <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setReadingModalVisible(false)}>
                        <View className="bg-white dark:bg-surfaceBlack rounded-t-[40px] p-8">
                            <Text className="text-xl font-bold dark:text-white text-center mb-6">{t('readingMode')}</Text>
                            <View className="flex-row justify-around">
                                <TouchableOpacity onPress={() => setReadingMode(false)} className={`p-4 rounded-2xl border-2 ${!readingMode ? 'border-primaryGold' : 'border-transparent'}`}>
                                    <Image source={require('../../assets/images/scroll-preview.jpg')} style={{ width: 100, height: 160, borderRadius: 8 }} resizeMode="cover" />
                                    <Text className="dark:text-white mt-2 text-center">{t('scroll')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setReadingMode(true)} className={`p-4 rounded-2xl border-2 ${readingMode ? 'border-primaryGold' : 'border-transparent'}`}>
                                    <Image source={require('../../assets/images/pages-preview.jpg')} style={{ width: 100, height: 160, borderRadius: 8 }} resizeMode="cover" />
                                    <Text className="dark:text-white mt-2 text-center">{t('pages')}</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity 
                                className="bg-primaryGold p-4 rounded-xl mt-8"
                                onPress={async () => {
                                    await DB.updateSettings({reading_mode: readingMode ? 1 : 0});
                                    setReadingModalVisible(false);
                                }}>
                                <Text className="text-center font-bold">{t('confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
            </View>
        </SafeAreaView>
    )
}

export default Settings
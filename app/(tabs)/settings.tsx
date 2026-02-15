import { FlatList, Modal, ScrollView, StyleSheet, Image, Switch, Text, TouchableOpacity, View, Pressable, I18nManager } from 'react-native'
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
    {id: 2, text: "notifications", path: "notifications", icon: "notifications"},
    {id: 3, text: "fonts", path: null, icon: "pencil"},
    {id: 4, text: "darkMode", path: null, icon: "contrast"},
    {id: 5, text: "readingMode", path: null, icon: "book"},
    {id: 6, text: "language", path: null, icon: "language"}
]

const FONT_OPTIONS = [
	'Amiri-Bold',
	'Amiri-BoldItalic',
	'Amiri-Italic',
	'Amiri-Regular',
	'D1',
	'D2',
	'HAFS',
	'J1',
	'J2',
	'Q1',
	'U3',
	'UthmanTN1-Ver10',
	'UthmanTN_v2-0'
]

const LANGUAGE_CHOICES = [
    {key: 'en', value: 'english'},
    {key: 'ar', value: 'arabic'}
]


/*
Notes:
0 => scroll
1 => pages

0 => light mode
1 => dark mode
*/

const settings = () => {
	const { colorScheme, setColorScheme } = useColorScheme();
	const { t } = useTranslation();
	const router = useRouter();
	const [fontModalVisible, setFontModalVisible] = useState<boolean>(false)
	const [readingModalVisible, setReadingModalVisible] = useState<boolean>(false)
	const [readingMode, setReadingMode] = useState<boolean>(false)
	const [isEnabled, setIsEnabled] = useState(false);
	const [selectedLang, setSelectedLang] = React.useState("");
	const toggleSwitch = () => setIsEnabled(previousState => !previousState);
	const renderOption = ({ item }: any) => {
        return (
            <TouchableOpacity onPress={() => {
                    if (item.id === 3) {
                        setFontModalVisible(true)
                    }
                    else if (item.id === 4) {
                        
                    }
                    else if (item.id === 5) {
                        setReadingModalVisible(true)
                    }
                    else if (item.id === 6) {
                        
                    }
                    else {
                        router.push(item.path)
                    }
                }}>

                <View 
                    className="flex-row items-center justify-between p-4 mb-3 bg-gray-100 dark:bg-surfaceBlack rounded-2xl border border-settingsGold/20 dark:border-settingsGold/30"
                >
                    <View className="flex-row items-center">
                        <Ionicons name={item.icon} size={22} color="#D4AF37" />
                        <Text className="text-black dark:text-white text-base font-medium ml-4">
                            {t(item.text)}
                        </Text>
                    </View>
                    {item.id === 4 && 
                        <Switch
                            trackColor={{false: '#767577', true: '#D4AF37'}}
                            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange= { async () => {
                                toggleSwitch()
								let val = 0
                                if (isEnabled) val = 1
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
										setSelectedLang(val)
										let lang = "en"
										if (val === "arabic") lang = "ar"
										await changeLang(lang)
									}
								}
							} 
							data={LANGUAGE_CHOICES} 
							save="value"
							boxStyles={{
								backgroundColor: colorScheme === 'dark' ? '#121212' : '#F3F4F6',
								borderColor: colorScheme === 'dark' ? 'rgba(197, 160, 89, 0.3)' : 'rgba(197, 160, 89, 0.2)',
								borderRadius: 16,
								paddingVertical: 14,
							}}
							inputStyles={{
								color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
								fontWeight: '500',
							}}
							dropdownStyles={{
								backgroundColor: colorScheme === 'dark' ? '#121212' : '#F3F4F6',
								borderColor: colorScheme === 'dark' ? 'rgba(197, 160, 89, 0.3)' : 'rgba(197, 160, 89, 0.2)',
								borderRadius: 16,
								marginTop: 8,
							}}
							dropdownTextStyles={{
								color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
							}}
							dropdownItemStyles={{
								borderBottomWidth: 1,
								borderBottomColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
								paddingVertical: 12,
							}}
							arrowicon={
								<Ionicons name="chevron-down" size={18} color="#C5A059" />
							}
							searchicon={
								<Ionicons name="search" size={16} color="#C5A059" style={{marginRight: 8}} />
							}
							placeholder={t('selectLanguage')}
						/>
					}
                    {item.id !== 4 && item.id !==6 && <MaterialIcons name="chevron-right" size={20} color={colorScheme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />}
                </View>
            </TouchableOpacity>
      );
    };

const changeLang = async (lang: string = "en", startup: boolean = false) => {
	console.log(`changing to ${lang}`)
	await i18n.changeLanguage(lang)
	if (startup) {
		I18nManager.allowRTL(lang === "ar");
		I18nManager.forceRTL(lang === "ar");
	}
	else {
		await DB.updateSettings({language: lang})
		I18nManager.allowRTL(lang === "ar");
		I18nManager.forceRTL(lang === "ar");
		await (async () => {
			return await Updates.reloadAsync();
		})();
	}
}

useEffect(() => {
  const init = async () => {
    console.log("Initializing Settings");

	const current_settings = await DB.getSettings() as UserSettings[]

	setIsEnabled(current_settings[0].theme === 0)
	setColorScheme(current_settings[0].theme === 0 ? "dark" : "light")
	setReadingMode(current_settings[0].reading_mode === 1)

	changeLang(current_settings[0].language, true)

	console.log("Done")
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
                    <Text className="text-gray-500 dark:text-light-300 text-sm mt-1 text-center">
                        {t('customize')}
                    </Text>
                </View>
            </View>

            <FlatList 
                data = {OPTIONS}
                renderItem = {renderOption}
                keyExtractor={(item) => item.id.toString()}
                className='px-5'
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={fontModalVisible}
                onRequestClose={() => setFontModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/60"> 
                    <View className="bg-bgWhite dark:bg-surfaceBlack rounded-t-3xl p-6 border-t border-settingsGold/50">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-primaryGold text-xl font-bold">Select Font</Text>
                            <TouchableOpacity onPress={() => setFontModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colorScheme === 'dark' ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="max-h-80">
                            {FONT_OPTIONS.map((font) => (
                                <TouchableOpacity 
                                    key={font} 
                                    className="p-4 mb-2 bg-gray-50 dark:bg-matteBlack rounded-xl border border-black/5 dark:border-white/5"
                                    onPress={async () => {
                                        await DB.updateSettings({font: font})
                                        setFontModalVisible(false);
                                    }}
                                >
                                    <Text className="text-black dark:text-white text-right text-lg" style={{fontFamily: font}}>
                                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                    </Text>
                                    <Text className="text-settingsGold/60 text-xs mt-1">{font}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={readingModalVisible}
                onRequestClose={() => setReadingModalVisible(false)}
            >
                <Pressable 
                    className="flex-1 bg-black/70 justify-end" 
                    onPress={() => setReadingModalVisible(false)}
                >
                    <View className="bg-white dark:bg-surfaceBlack rounded-t-[40px] p-8 border-t border-settingsGold/30">
                        <View className="w-12 h-1 bg-gray-300 dark:bg-white/10 rounded-full self-center mb-6" />
                        
                        <Text className="text-black dark:text-white text-xl font-bold text-center mb-8">
                            Reading Mode
                        </Text>

                        <View className="flex-row justify-between">
                            <TouchableOpacity 
                                onPress={() => setReadingMode(false)}
                                className="items-center w-[45%]"
                            >
                                <View className={`w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 ${
                                    readingMode === false ? 'border-settingsGold' : 'border-transparent bg-gray-200 dark:bg-white/5'
                                }`}>
                                    <Image
                                        source={require('../../assets/images/scroll-preview.jpg')}
                                        className={`w-full h-full ${readingMode === false ? 'opacity-100' : 'opacity-40'}`}
                                        resizeMode="cover"
                                    />
                                </View>
                                <Text className={`mt-3 font-bold ${readingMode === false ? 'text-settingsGold' : 'text-gray-400 dark:text-white/50'}`}>
                                    {t('scroll')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => setReadingMode(true)}
                                className="items-center w-[45%]"
                            >
                                <View className={`w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 ${
                                    readingMode === true ? 'border-settingsGold' : 'border-transparent bg-gray-200 dark:bg-white/5'
                                }`}>
                                    <Image
                                        source={require('../../assets/images/pages-preview.jpg')}
                                        className={`w-full h-full ${readingMode === true ? 'opacity-100' : 'opacity-40'}`}
                                        resizeMode="cover"
                                    />
                                </View>
                                <Text className={`mt-3 font-bold ${readingMode === true ? 'text-settingsGold' : 'text-gray-400 dark:text-white/50'}`}>
                                    {t('pages')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            onPress={async () => {
                                let val = 0
								if (readingMode) val = 1
                                await DB.updateSettings({reading_mode: val})
                                setReadingModalVisible(false)
                            }}
                            className="mt-10 bg-settingsGold py-4 rounded-2xl items-center"
                        >
                            <Text className="text-matteBlack font-bold text-base">{t('confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    </SafeAreaView>
  )
}

export default settings

const styles = StyleSheet.create({})
import { FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import * as DB from '../../utils/DatabaseManager'

interface UserSettings {
    id: number;
    font: string;
    font_size: number;
    reading_mode: number;
    partition_type: number;
    starting_date: string;
    ending_date: string;
    theme: number;
}

const OPTIONS = [
	{id: 1, text: "Werd Goal Setup", path: "goalSetup", icon: "book"},
	{id: 2, text: "Notification Settings", path: "notifications", icon: "notifications"},
	{id: 3, text: "Fonts", path: null, icon: "pencil"},
	{id: 4, text: "Theme", path: null, icon: "contrast"},
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


const settings = () => {
	const router = useRouter();
	const [fontModalVisible, setFontModalVisible] = useState<boolean>(false)
	const [isEnabled, setIsEnabled] = useState(false);
	const toggleSwitch = () => setIsEnabled(previousState => !previousState);
	const renderOption = ({ item }: any) => {
		return (
			<TouchableOpacity onPress={() => {
					if (item.id === 3) {
						setFontModalVisible(true)
					}
					else {
						router.push(item.path)
					}
				}}>

				<View 
				
					className="flex-row items-center justify-between p-4 mb-3 bg-surfaceBlack rounded-2xl border border-settingsGold/30"
				
				>
					<View className="flex-row items-center">
						<Ionicons name={item.icon} size={22} color="#D4AF37" />
						<Text className="text-white text-base font-medium ml-4">
							{item.text}
						</Text>
					</View>
					{item.id === 4 && 
						<Switch
							trackColor={{false: '#767577', true: '#81b0ff'}}
							thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
							ios_backgroundColor="#3e3e3e"
							onValueChange= { () => {
								toggleSwitch()
								let val = 0
								if (isEnabled) val = 1
								DB.updateSettings({theme: val})
							}}
							value={isEnabled}
						/>
					}
					{item.id !== 4 && <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />}
				</View>
			</TouchableOpacity>
	  );
	};

useEffect(() => {
  const init = async () => {
    console.log("Initializing database...");
    await DB.initDB(0);
	// await DB.addQuranText();
	await DB.test(4, 5);
	const current_settings = await DB.getSettings() as UserSettings[]
	setIsEnabled(current_settings[0].theme === 0)

	console.log("Done")
  };
  init();
}, []);

	return (
		<SafeAreaView className="flex-1 bg-matteBlack">
		<View>
			<View className="mb-8 mt-2">
				<View className='w-[100%] justify-center items-center'>
					<Text className='text-primaryGold mt-8 text-xl font-bold'> SETTINGS </Text>
				</View>
				<View className='w-[100%] justify-center items-center'>
					<Text className="text-light-300 text-sm mt-1 text-center">
						Customize your experience
					</Text>
				</View>
        	</View>

			<FlatList 
				data = {OPTIONS}
				renderItem = {renderOption}
				keyExtractor={(item) => item.id.toString()}
				className='mr-5 ml-5'
			/>
			<Modal
				animationType="slide"
				transparent={true}
				visible={fontModalVisible}
				onRequestClose={() => setFontModalVisible(false)}
			>
				<View className="flex-1 justify-end bg-black/60"> 
                    <View className="bg-surfaceBlack rounded-t-3xl p-6 border-t border-settingsGold/50">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-primaryGold text-xl font-bold">Select Font</Text>
                            <TouchableOpacity onPress={() => setFontModalVisible(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="max-h-80">
                            {FONT_OPTIONS.map((font) => (
                                <TouchableOpacity 
                                    key={font} 
                                    className="p-4 mb-2 bg-matteBlack rounded-xl border border-white/5"
                                    onPress={async () => {
										await DB.updateSettings({font: font})
                                        setFontModalVisible(false);
                                    }}
                                >
                                    <Text className="text-white text-right text-lg" style={{fontFamily: font}}>
                                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                    </Text>
                                    <Text className="text-settingsGold/60 text-xs mt-1">{font}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
			</Modal>
		</View>
    </SafeAreaView>
  )
}

export default settings

const styles = StyleSheet.create({})
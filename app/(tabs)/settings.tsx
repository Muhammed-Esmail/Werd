import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

const OPTIONS = [
	{id: 1, text: "Werd Goal Setup", path: "goalSetup", icon: "book"},
	{id: 2, text: "Notification Settings", path: "notifications", icon: "notifications"}
]


const settings = () => {
	const router = useRouter();
	const renderOption = ({ item }: any) => {
		return (
			<TouchableOpacity onPress={() => {router.push(item.path)}}>
				<View 
				
					className="flex-row items-center justify-between p-4 mb-3 bg-surfaceBlack rounded-2xl border border-settingsGold/30"
				
				>
					<View className="flex-row items-center">
						<Ionicons name={item.icon} size={22} color="#D4AF37" />
						<Text className="text-white text-base font-medium ml-4">
							{item.text}
						</Text>
					</View>
					<MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
				</View>
			</TouchableOpacity>
	  );
	};

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
		</View>
    </SafeAreaView>
  )
}

export default settings

const styles = StyleSheet.create({})
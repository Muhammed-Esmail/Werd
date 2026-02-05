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
			<View className="flex-row items-center justify-between p-4 mb-3 bg-[#1A1A1A] rounded-2xl border border-gray-800">
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
				<Text className="text-3xl font-bold text-primaryGold tracking-tight text-center">
					Settings
				</Text>
				<Text className="text-light-300 text-sm mt-1 text-center">
					Customize your experience
				</Text>
        	</View>
			<FlatList
				data = {OPTIONS}
				renderItem = {renderOption}
				keyExtractor={(item) => item.id.toString()}
			/>
		</View>
    </SafeAreaView>
  )
}

export default settings

const styles = StyleSheet.create({})
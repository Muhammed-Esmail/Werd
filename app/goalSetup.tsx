import { StyleSheet, Text, View, Pressable, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router';

const RadioButton = ({text, selected, description, onSelected}: any) => {
    return (
        <Pressable 
            onPress={onSelected}
            className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border-2 ${
                selected ? "border-primaryGold bg-[#1A1A1A]" : "border-gray-800 bg-transparent"
            }`}
        >
			<View>
				<Text className={`${selected ? "text-successGreen font-bold" : "text-gray-400"}`}>
					{text}
				</Text>
				<Text className={`${selected ? "text-successGreen" : "text-gray-300"}`}>
					{description}
				</Text>
			</View>
            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                selected ? 'border-primaryGold' : 'border-gray-600'
            }`}>
                {selected && <View className="h-2.5 w-2.5 rounded-full bg-primaryGold" />}
            </View>
        </Pressable>
    );
}

const GOAL_OPTIONS = [
	{ id: 1, text: 'Serious', description: '3 Months' },
	{ id: 2, text: 'Regular', description: '1 Month' },
	{ id: 3, text: 'Casual', description: '1 Week' },
];

const PARTITION_OPTIONS = [
	{id: 1, text: 'By Juz', description: 'Read one Juz per day'},
	{id: 2, text: 'By Page', description: 'Read a number of pages per day'},
	{id: 3, text: 'By Surah', description: 'Read a Surah per day'}
]

const goalSetup = () => {
	const [selectedGoal, setGoal] = useState<number>(1);
	const [selectedPartition, setPartition] = useState<number>(1);

	const setWerdSettings = () => {
		alert("Werd Settings Set!")
	}

	const renderOption = (item: any, currentSelected: number, setter: (id: number) => void) => {
		return (
			<RadioButton text={item.text} description={item.description} selected={currentSelected === item.id} onSelected={() => setter(item.id)}></RadioButton>		
		);
	}
	
	return (
		<>
		<Stack.Screen options={{ headerShown: false }} />
		<SafeAreaView className="flex-1 bg-matteBlack">
			<ScrollView 
                className="flex-1 px-6" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
				<Text className="text-3xl font-bold text-primaryGold tracking-tight text-center">Werd Goal</Text>
				<Text className="text-light-300 text-sm mt-1 text-center mb-10">Choose a plan that fits you</Text>

				<Text className="text-primaryGold mb-4 text-2xl font-bold">Finishing Period</Text>
				<FlatList
					data = {GOAL_OPTIONS}
					renderItem={({item}) => renderOption(item, selectedGoal, setGoal)}
					keyExtractor={(item) => item.id.toString()}
					extraData={selectedGoal}
					scrollEnabled={false}
				/>

				<View className="h-[1px] bg-gray-800 w-full my-8" />

				<Text className="text-primaryGold mb-4 text-2xl font-bold">Partitioning</Text>
				<FlatList
					data = {PARTITION_OPTIONS}
					renderItem={({item}) => renderOption(item, selectedPartition, setPartition)}
					keyExtractor={(item) => item.id.toString()}
					extraData={selectedPartition}
					scrollEnabled={false}
				/>

				<View className="h-[1px] bg-gray-800 w-full my-8" />

				<TouchableOpacity 
					onPress={setWerdSettings}
					className="bg-[#1A1A1A] border-2 border-primaryGold rounded-2xl py-4 px-8 mt-10 active:opacity-70"
				>
					<Text className="text-primaryGold text-base font-bold text-xl text-center">START MY WERD</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
    </>
    );
}

export default goalSetup

const styles = StyleSheet.create({})
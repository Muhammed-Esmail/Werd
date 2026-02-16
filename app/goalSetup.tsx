import { StyleSheet, Text, View, Pressable, FlatList, ScrollView, TouchableOpacity } from 'react-native'
	import React, { useState } from 'react'
	import { SafeAreaView } from 'react-native-safe-area-context'
	import { Stack } from 'expo-router';
	import DateTimePicker from '@react-native-community/datetimepicker';
	import Slider from '@react-native-community/slider';
	import { SkipEnteringContext } from 'react-native-reanimated/lib/typescript/component/LayoutAnimationConfig';
	import * as DB from "@/utils/DatabaseManager"

	const RadioButton = ({text, selected, description, onSelected}: any) => {
		return (
			<Pressable 
				onPress={onSelected}
				className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border-2 ${
					selected ? "border-primaryGold bg-gray-100 dark:bg-[#1A1A1A]" : "border-gray-300 dark:border-gray-800 bg-transparent"
				}`}
			>
				<View>
					<Text className={`${selected ? "text-green-600 dark:text-successGreen font-bold" : "text-gray-500 dark:text-gray-400"}`}>
						{text}
					</Text>
					<Text className={`${selected ? "text-green-600 dark:text-successGreen" : "text-gray-600 dark:text-gray-300"}`}>
						{description}
					</Text>
				</View>
				<View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
					selected ? 'border-primaryGold' : 'border-gray-400 dark:border-gray-600'
				}`}>
					{selected && <View className="h-2.5 w-2.5 rounded-full bg-primaryGold" />}
				</View>
			</Pressable>
		);
	}

	const GOAL_OPTIONS = [
		{ id: 1, text: 'Casual', description: '3 Months', days: 90 },
		{ id: 2, text: 'Regular', description: '1 Month', days: 30 },
		{ id: 3, text: 'Serious', description: '1 Week', days: 7 },
	];

	const PARTITION_OPTIONS = [
		{id: 1, text: 'By Juz', description: 'Read one Juz per day', partitionType: 'juz'},
		{id: 2, text: 'By Surah', description: 'Read a Surah per day', partitionType: 'surah'},
		{id: 3, text: 'By Page', description: 'Read a number of pages per day', partitionType: 'page'}
	]

	const goalSetup = () => {
		const [date, setDate] = useState(new Date())
		const [show, setShow] = useState<boolean>(false)

		const [selectedGoal, setGoal] = useState<number>(1);
		const [prevGoal, setPrevGoal] = useState<number>(1);
		const [selectedPartition, setPartition] = useState<number>(1);
		
		const [sliderValue, setSliderValue] = useState<number>(3)

		const setWerdSettings = async () => {
			let goal = 0
			if (selectedGoal === 4) {
				const now = new Date()
				goal = Math.ceil(Math.abs(date.getTime() - now.getTime())/(1000*60*60*24))
			}
			else goal = GOAL_OPTIONS[selectedGoal-1].days
			await DB.updateSettings({werd_plan_days: goal, partition_type: PARTITION_OPTIONS[selectedPartition-1].partitionType})
			alert("Werd Settings Set!")
			const settings = await DB.getSettings() as DB.UserSettings
			console.log(`settings = ${settings.werd_plan_days} , ${settings.partition_type}`)
		}

		const renderOption = (item: any, currentSelected: number, setter: (id: number) => void) => {
			return (
				<RadioButton text={item.text} description={item.description} selected={currentSelected === item.id} onSelected={
					async () => {
						setter(item.id)
					}
				}></RadioButton>		
			);
		}
		
		return (
			<>
			<Stack.Screen options={{ headerShown: false }} />
			<SafeAreaView className="flex-1 bg-gray-50 dark:bg-matteBlack">
				<ScrollView 
					className="flex-1 px-6" 
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<Text className="text-3xl font-bold text-primaryGold tracking-tight text-center">Werd Goal</Text>
					<Text className="text-gray-500 dark:text-light-300 text-sm mt-1 text-center mb-10">Choose a plan that fits you</Text>

					<Text className="text-primaryGold mb-4 text-2xl font-bold">Finishing Period</Text>
					<FlatList
						data = {GOAL_OPTIONS}
						renderItem={({item}) => renderOption(item, selectedGoal, setGoal)}
						keyExtractor={(item) => item.id.toString()}
						extraData={selectedGoal}
						scrollEnabled={false}
					/>

					<RadioButton text='Custom' description='Choose a custom period' selected={selectedGoal === 4} onSelected={() => {setPrevGoal(selectedGoal); setShow(true)}}></RadioButton>		
					{show && (
						<DateTimePicker
							value={date}
							mode="date"
							display={'default'}
							onChange={async (event: any, selectedDate: any) => {
								if (event.type === 'set') {
									console.log(selectedDate);
									if (selectedDate) setDate(selectedDate);
									setGoal(4)
								}
								else {
									console.log("user cancelled")
									setGoal(prevGoal)
								}
								setShow(false);
							}}
							minimumDate={new Date()}
						/>
					)}
					<View className="h-[1px] bg-gray-300 dark:bg-gray-800 w-full my-8" />

					<Text className="text-primaryGold mb-4 text-2xl font-bold">Partitioning</Text>
					<FlatList
						data = {PARTITION_OPTIONS}
						renderItem={({item}) => renderOption(item, selectedPartition, setPartition)}
						keyExtractor={(item) => item.id.toString()}
						extraData={selectedPartition}
						scrollEnabled={false}
					/>

					{selectedPartition === 3 && (
					<View className="mt-4 mb-2 p-4 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl border-2 border-gray-300 dark:border-gray-800">
						<Text className="text-primaryGold mb-3 text-center text-lg font-bold">
							{sliderValue} pages per day
						</Text>
						<Slider
							style={{ width: '100%', height: 40 }}
							minimumValue={1}
							maximumValue={50}
							step={1}
							value={sliderValue}
							onValueChange={(value) => setSliderValue(value)}
							minimumTrackTintColor="#D4AF37"
							maximumTrackTintColor="#374151"
							thumbTintColor="#D4AF37"
						/>
						<View className="flex-row justify-between mt-1">
							<Text className="text-gray-400 text-xs">1 page</Text>
							<Text className="text-gray-400 text-xs">50 pages</Text>
						</View>
					</View>
				)}

					<View className="h-[1px] bg-gray-300 dark:bg-gray-800 w-full my-8" />

					<TouchableOpacity 
						onPress={setWerdSettings}
						className="bg-gray-100 dark:bg-[#1A1A1A] border-2 border-primaryGold rounded-2xl py-4 px-8 mt-10 active:opacity-70"
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
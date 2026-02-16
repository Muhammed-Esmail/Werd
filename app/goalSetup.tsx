import { StyleSheet, Text, View, Pressable, FlatList, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { getDB, updateSettings } from '@/utils/DatabaseManager';
import { SegmentationEngine, PartitionType } from '@/core/SegmentationEngine'; 

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
	{ id: 1, text: 'Casual', description: '3 Months' },
	{ id: 2, text: 'Regular', description: '1 Month' },
	{ id: 3, text: 'Serious', description: '1 Week' },
];

const PARTITION_OPTIONS = [
	{id: PartitionType.JUZ, text: 'By Juz', description: 'Read one Juz per day'},
	{id: PartitionType.SURAH, text: 'By Surah', description: 'Read a Surah per day'},
	{id: PartitionType.PAGE, text: 'By Page', description: 'Read a number of pages per day'}
]

const goalSetup = () => {
    const router = useRouter();
	const [date, setDate] = useState(new Date())
	const [show, setShow] = useState<boolean>(false)

	const [selectedGoal, setGoal] = useState<number>(1);
	const [prevGoal, setPrevGoal] = useState<number>(1);
	const [selectedPartition, setPartition] = useState<number>(PartitionType.JUZ);
	
	const [sliderValue, setSliderValue] = useState<number>(3)

	const setWerdSettings = async () => {
        try {
            const db = await getDB();
            
            let days = 30;
            if (selectedGoal === 4) { // custom
                const diff = Math.abs(date.getTime() - new Date().getTime());
                days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            } else {
                if(selectedGoal === 1) days = 90;
                if(selectedGoal === 2) days = 30;
                if(selectedGoal === 3) days = 7;
            }
            if (days <= 0) days = 1;
            const pType = selectedPartition as PartitionType; 

            const plan = await SegmentationEngine.calculatePlan(db, days, pType);
            await SegmentationEngine.savePlanToDB(db, plan);

            await updateSettings({
                partition_type: pType,
                ending_date: date.toISOString(), 
                currentWerd: 1 
            });

            Alert.alert("Success", "Werd Settings Set!", [
                { text: "OK", onPress: () => router.push('/(tabs)/werd') }
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save settings.");
        }
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

				<RadioButton text='Custom' description='Choose a custom period' selected={selectedGoal === 4} onSelected={() => {setPrevGoal(selectedGoal); setShow(true)}}></RadioButton>		
				{show && (
					<DateTimePicker
						value={date}
						mode="date"
						display={'default'}
						onChange={(event: any, selectedDate: any) => {
							if (event.type === 'set') {
								if (selectedDate) setDate(selectedDate);
                                console.log(`user selected ${selectedDate}`)
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
				<View className="h-[1px] bg-gray-800 w-full my-8" />

				<Text className="text-primaryGold mb-4 text-2xl font-bold">Partitioning</Text>
				<FlatList
					data = {PARTITION_OPTIONS}
					renderItem={({item}) => renderOption(item, selectedPartition, setPartition)}
					keyExtractor={(item) => item.id.toString()}
					extraData={selectedPartition}
					scrollEnabled={false}
				/>

				{selectedPartition === 3 && (
				<View className="mt-4 mb-2 p-4 bg-[#1A1A1A] rounded-2xl border-2 border-gray-800">
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
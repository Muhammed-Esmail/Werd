import { View, Text, FlatList, SafeAreaViewBase, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { ReadingSession } from '@/types/quran_data'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { getMockReadingData } from '@/types/mocks/mock_data';
import { SurahSection } from '@/components/SurahSection';

interface ReaderProps {
  readingSession: ReadingSession;
}

const Reader = () => {

    const navigation = useNavigation();

    const { surahId, sessionType } = useLocalSearchParams<{ 
        surahId: string;
        sessionType: string;
    }>();

    // Fetch text somehow using params
    // ....

    const segments = getMockReadingData('full');

    return (
        <SafeAreaView className='bg-matteBlack h-full'>
            
            <Stack.Screen options={{ headerShown: false }} />

            {/* <TouchableOpacity
                onPress={() => navigation.goBack()}
            >
                <Text>Go Back</Text>
            
            </TouchableOpacity> */}
            
            <ScrollView>
            
            <SurahSection segment={segments.segments[0]} isLastSegment={false} />

            </ScrollView>

        </SafeAreaView>
    )
}

export default Reader
import { Text, ScrollView } from 'react-native'
import React from 'react'
import { ReadingSession } from '@/types/quran_data'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ReaderInfiniteScroll } from '@/components/ReaderInfiniteScroll';
import { ReaderPages } from '@/components/ReaderPages';

interface ReaderProps {
    readingSession: ReadingSession;
}

const ReaderMode = {
    PAGES: 'pages',
    INFINITE_SCROLL: 'infinite_scroll',
}

const Reader = () => {

    const mode = ReaderMode.INFINITE_SCROLL; // Change this to switch modes

    if(mode === ReaderMode.PAGES) {
        return <ReaderPages/>
    }
    else if(mode === ReaderMode.INFINITE_SCROLL) {
        return <ReaderInfiniteScroll/>
    }
    
    return (
        <SafeAreaView className='bg-matteBlack h-full'>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView>
                <Text className='text-white'>Reader Mode Coming Soon...</Text>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Reader
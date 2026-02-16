import React, { use, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ReaderInfiniteScroll } from '@/components/ReaderInfiniteScroll';
import { ReaderPages } from '@/components/ReaderPages';
import * as DB from "@/utils/DatabaseManager";

const ReaderMode = {
    PAGES: 'pages',
    INFINITE_SCROLL: 'infinite_scroll',
}

const Reader = () => {

    const [readerMode, setReaderMode] = React.useState<string>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMode = async () => {
            await DB.getDB()
            const settings = await DB.getSettings() as DB.UserSettings;
            const readerMode = settings.reading_mode;
            console.log(`Reading Mode = ${readerMode}`)
            if(readerMode === undefined || readerMode === 0) {
                setReaderMode(ReaderMode.INFINITE_SCROLL);
            } else {
                setReaderMode(ReaderMode.PAGES);
            }
        };
        loadMode();
    }, []);
    
    if(readerMode === ReaderMode.PAGES) {
        return <ReaderPages/>
    }
    else if(readerMode === ReaderMode.INFINITE_SCROLL) {
        return <ReaderInfiniteScroll/>
    }
    
    return (
        <SafeAreaView className='bg-matteBlack h-full'>
            <Stack.Screen options={{ headerShown: false }} />
        </SafeAreaView>
    )
}

export default Reader
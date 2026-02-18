import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import './globals.css';
import * as DB from "@/utils/DatabaseManager"
import * as rd from '@/types/reader_data';
import i18n from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const { setColorScheme } = useColorScheme();

    const [loaded, error] = useFonts({
        'Amiri-Regular': require('../assets/fonts/Amiri-Regular.ttf'),
        'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
        'Amiri-BoldItalic': require('../assets/fonts/Amiri-BoldItalic.ttf'),
        'Amiri-Italic': require('../assets/fonts/Amiri-Italic.ttf'),
        'U1': require('../assets/fonts/UthmanTN1-Ver10.otf'),
        'Hafs': require('../assets/fonts/HAFS.otf'),
        'U2': require('../assets/fonts/UthmanTN_v2-0.ttf'),
        'U3': require('../assets/fonts/U3.ttf'),
        'D1': require('../assets/fonts/D1.ttf'),
        'D2': require('../assets/fonts/D2.ttf'),
        'Q1': require('../assets/fonts/Q1.ttf'),
        'J1': require('../assets/fonts/J1.ttf'),
        'J2': require('../assets/fonts/J2.ttf'),
    });

    useEffect(() => {
        async function prepare() {
            try {
                console.log("Initializing database...");

                // await DB.initDB(1);
                await DB.initDB(0);
                // await DB.test(114, 114);

                const settings = await DB.getSettings();
                if (settings) {
                    setColorScheme(settings.theme === 0 ? 'dark' : 'light');
                    if (settings.language) {
                        await i18n.changeLanguage(settings.language);
                    }
                }

                const surahs = await DB.getSurahs();
                if (surahs) {
                    rd.SURAH_DATA.length = 0;
                    rd.SURAH_DATA.push(...surahs as any);
                    console.log(`surahs size = ${rd.SURAH_DATA.length}`)
                }
            } catch (e) {
                console.warn(e);
            } finally {
                setAppIsReady(true);
            }

            console.log("Done")
        };
        prepare();
    }, []);

    useEffect(() => {
        if (loaded && appIsReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, appIsReady]);

    if (!appIsReady || !loaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}
import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import './globals.css';
import * as DB from "@/utils/DatabaseManager"
import * as rd from '@/types/reader_data';

export default function RootLayout() {
  
  const [loaded, error] = useFonts({
    'Amiri-Regular': require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
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
    const init = async () => {
      console.log("Initializing database...");
      
      await DB.initDB(1);
      await DB.addQuranText();
      await DB.setSettings()
      await DB.setWerdSegments()
      await DB.test(5, 6);

      const surahs = await DB.getSurahs();
      if (surahs) {
        rd.SURAH_DATA.length = 0;
        rd.SURAH_DATA.push(...surahs as any);
      }
  
    console.log("Done")
    };
    init();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return <Stack>
    <Stack.Screen 
      name="(tabs)"
      options={{headerShown:false}}
    />
  </Stack>;
}
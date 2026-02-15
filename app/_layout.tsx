import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import './globals.css';

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
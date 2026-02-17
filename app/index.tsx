import { View, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import * as DB from "@/utils/DatabaseManager";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const settings = await DB.getSettings();
        // @ts-ignore
        if (settings && settings.setup_completed === 1) {
          router.replace('/(tabs)/werd');
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error("Failed to check onboarding status", error);
        router.replace('/onboarding');
      }
    };

    checkOnboarding();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
       <ActivityIndicator size="large" color="#D4AF37" />
    </View>
  );
}
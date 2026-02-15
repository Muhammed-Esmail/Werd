import { Link } from "expo-router";
import { View } from "react-native";
import React from "react";

export default function Index() {
  return (
    <View className=""
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link href={'/(tabs)/werd'}> Werd </Link>
    </View>
  );
}

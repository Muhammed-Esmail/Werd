import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from 'react';
import { Text, View } from "react-native";

const TabIcon = ({focused, iconName, title}: any) =>{
    const val = 30;
    if(focused){
        return (
            <View 
                className='items-center min-w-[300px]'
                hitSlop={{ top: val, bottom: val, left: val, right: val }}
            >
                <MaterialIcons name={iconName} size={20} color={'rgba(212, 175, 55, 1)'} />
                <Text className='text-[10px]  text-primaryGold font-medium mt-1'>{title}</Text>
            </View>
        )
    }
    else{
        return(
            <View 
                className='items-center min-w-[60px]'
                hitSlop={{ top: val, bottom: val, left: val, right: val }}
            >
                <MaterialIcons name={iconName} size={20} color={'rgba(212, 175, 55, 0.5)'} />
                <Text className='text-[10px] text-mutedWhite font-medium mt-1'>{title}</Text>
            </View>
        )
    }

}

const _layout = () => {
  let color = '#0A0A0A';
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarItemStyle: {
                paddingVertical: 17,
                justifyContent: "center",
                alignItems: 'center'
            },
            tabBarStyle: {
                backgroundColor: color,
                borderRadius: 50,
                marginHorizontal: 10,
                marginBottom: 40,
                height: 70,
                position:'absolute',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: color
            }
        }}
        >
        <Tabs.Screen
            name="werd"
            options={{
            title: "Werd",
            tabBarIcon: ({ focused }) => (
                <TabIcon focused={focused} iconName="auto-stories" title="Werd" />
            )
            }}
        />
        <Tabs.Screen
            name="explore"
            options={{
            title: "Explore",
            tabBarIcon: ({ focused }) => (
                <TabIcon focused={focused} iconName="format-list-bulleted" title="Explore" />
            )
            }}
        />
        <Tabs.Screen
            name="streaks"
            options={{
            title: "Streaks",
            tabBarIcon: ({ focused }) => (
                <TabIcon focused={focused} iconName="bolt" title="Streaks" />
            )
            }}
        />
        <Tabs.Screen
            name="settings"
            options={{
            title: "Settings",
            tabBarIcon: ({ focused }) => (
                <TabIcon focused={focused} iconName="settings" title="Settings" />
            )
            }}
        />  
    </Tabs>
    )
}

export default _layout
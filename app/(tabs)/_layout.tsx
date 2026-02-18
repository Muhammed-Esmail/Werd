import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from 'react';
import { Text, View, I18nManager } from "react-native";
import { useColorScheme } from "nativewind";
import tailwindConfig from '@/tailwind.config.js';
import resolveConfig from 'tailwindcss/resolveConfig';
import { useTranslation } from 'react-i18next';

const fullConfig = resolveConfig(tailwindConfig);

const TabIcon = ({focused, iconName, title}: any) =>{
    const val = 30;
    return (
        <View 
            className={`items-center ${focused ? 'min-w-[50px]' : 'min-w-[60px]'}`}
            hitSlop={{ top: val, bottom: val, left: val, right: val }}
        >
            <MaterialIcons 
                name={iconName} 
                size={22} 
                color={focused ? 'rgba(212, 175, 55, 1)' : 'rgba(212, 175, 55, 0.5)'} 
            />
            <Text className={`text-[10px] font-medium mt-1 ${focused ? 'text-primaryGold' : 'text-gray-500 dark:text-mutedWhite'}`}>
                {title}
            </Text>
        </View>
    )
}

const _layout = () => {
    const { colorScheme } = useColorScheme();
    const { t } = useTranslation();
    const colors = fullConfig.theme.colors as any;
    const tabColors = colorScheme === 'dark' ? colors.bgBlack : colors.bgWhite;
    
    return (
    <Tabs
        key={colorScheme}
        screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarItemStyle: {
                paddingVertical: 17,
                justifyContent: "center",
                alignItems: 'center'
            },
            tabBarStyle: {
                backgroundColor: tabColors,
                borderRadius: 50,
                marginHorizontal: 10,
                marginBottom: 40,
                height: 70,
                position:'absolute',
                borderWidth: 1,
                borderColor: colorScheme === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row'
            },
        }}
        >
        <Tabs.Screen
            name="werd"
            options={{
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} iconName="auto-stories" title={t('werd')} />
                )
            }}
        />
        <Tabs.Screen
            name="explore"
            options={{
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} iconName="format-list-bulleted" title={t('explore')} />
                )
            }}
        />
        <Tabs.Screen
            name="streaks"
            options={{
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} iconName="bolt" title={t('streaks')} />
                )
            }}
        />
        <Tabs.Screen
            name="settings"
            options={{
                tabBarIcon: ({ focused }) => (
                    <TabIcon focused={focused} iconName="settings" title={t('settings')} />
                )
            }}
        />  
    </Tabs>
    )
}

export default _layout;
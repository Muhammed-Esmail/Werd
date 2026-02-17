import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import React from 'react';

interface Marker{
    type: 'surah' | 'juz';
    position: number;
    id : number;
    name?: string;
}

interface ReaderLandmarkProps {
    markers: Marker[];
    progress: number; // Progress in percentage (0-100)
    totalHeight: number; // Total height of the reader content
}

export const ReaderLandmark = ({markers, progress, totalHeight} : ReaderLandmarkProps) => {
    const [animatedProgress] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [progress])

    const [barHeight, setBarHeight] = useState(0);

    // This gets the actual height of the visual bar on the screen
    const onLayout = (event: any) => {
        setBarHeight(event.nativeEvent.layout.height);
    };

    const progressHeight = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [0, barHeight-20], // Subtract top and bottom padding
    });

    const currentPosition = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [5, barHeight-40],
    });

    const syncRange = ["0%", "100%"];

    return (
        <View className="h-full w-10 items-center py-5">
            
            {/* THE TRACK (Background) */}
            <View className="h-full w-1 bg-white/15 rounded-full overflow-hidden">
                {/* Progress Fill */}
                <Animated.View
                    className="w-full bg-primaryGold"
                    style={{ 
                        height: animatedProgress.interpolate({
                            inputRange: [0, 100],
                            outputRange: syncRange,
                        }) 
                    }}
                />
            </View>

            {/* 2. Markers & Indicator */}
            <View className="absolute inset-y-5 w-full items-center">
                {markers.map((marker) => {
                    if (marker.type === 'surah') {
                        return (
                            <View
                                key={`surah-${marker.id}`}
                                className='w-4 h-2 bg-surahMarker rounded-sm'
                                style={{ 
                                    top: `${marker.position}%`,
                                    transform: [{ translateY: -3 }] 
                                }}
                            />
                        );
                    } else {
                        // JUZ STAR (Rub el Hizb style)
                        const isPassed = progress > marker.position;
                        return (
                            <View 
                                key={`juz-${marker.id}`}
                                className="absolute items-center justify-center"
                                style={{ 
                                    top: `${marker.position}%`, 
                                    transform: [{ translateY: -6 }] 
                                }}
                            >
                                {/* Shadow/Glow for contrast against the track */}
                                <View 
                                    className="absolute w-3.5 h-3.5 bg-black/40 rotate-0 rounded-sm" 
                                    style={{ transform: [{ scale: 1.2 }] }}
                                />
                                
                                {/* The Star: Two overlapping squares */}
                                <View 
                                    className="absolute w-3 h-3 rotate-0 rounded-[1px] bg-juzStar" 
                                    style={{
                                        opacity: isPassed ? 1 : 0.3,
                                    }}
                                />
                                <View 
                                    className="absolute w-3 h-3 rotate-45 rounded-[1px] bg-juzStar"
                                    style={{
                                        opacity: isPassed ? 1 : 0.3,
                                    }}
                                />
                            </View>
                        );
                    }
                })}

                {/* Current Position Indicator (The Circle) */}
                <Animated.View
                    className="absolute w-5 h-5 bg-circleIndicator rounded-full border-2 border-matteBlack shadow-sm"
                    style={{
                        top: animatedProgress.interpolate({
                            inputRange: [0, 100],
                            outputRange: syncRange,
                        }),
                        transform: [{ translateY: -10 }], 
                    }}
                />
            </View>
        </View>
    )
}
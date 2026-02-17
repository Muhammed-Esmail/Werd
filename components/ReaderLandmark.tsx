import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import React from 'react';

interface Marker {
    type: 'surah' | 'juz';
    position: number;
    id: number;
    name?: string;
}

interface ReaderLandmarkProps {
    markers: Marker[];
    progress: Animated.Value;
    totalHeight?: number;
}

export const ReaderLandmark = ({ markers, progress }: ReaderLandmarkProps) => {
    const syncRange = ["0%", "100%"];

    return (
        <View className="h-full w-10 items-center py-5">
            <View className="h-full w-1 bg-textDeep/15 dark:bg-white/15 rounded-full overflow-hidden">
                <Animated.View
                    className="w-full bg-primaryGold"
                    style={{
                        height: progress.interpolate({
                            inputRange: [0, 100],
                            outputRange: syncRange,
                        })
                    }}
                />
            </View>

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
                        return (
                            <View
                                key={`juz-${marker.id}`}
                                className="absolute items-center justify-center"
                                style={{
                                    top: `${marker.position}%`,
                                    transform: [{ translateY: -6 }]
                                }}
                            >
                                <View
                                    className="absolute w-3.5 h-3.5 bg-white/40 dark:bg-black/40 rotate-0 rounded-sm"
                                    style={{ transform: [{ scale: 1.2 }] }}
                                />
                                <View
                                    className="absolute w-3 h-3 rotate-0 rounded-[1px] bg-juzStar"
                                    style={{ opacity: 0.8 }}
                                />
                                <View
                                    className="absolute w-3 h-3 rotate-45 rounded-[1px] bg-juzStar"
                                    style={{ opacity: 0.8 }}
                                />
                            </View>
                        );
                    }
                })}

                <Animated.View
                    className="absolute w-5 h-5 bg-circleIndicator rounded-full border-2 border-matteBlack shadow-sm"
                    style={{
                        top: progress.interpolate({
                            inputRange: [0, 100],
                            outputRange: syncRange,
                        }),
                        transform: [{ translateY: -10 }],
                    }}
                />
            </View>
        </View>
    );
};
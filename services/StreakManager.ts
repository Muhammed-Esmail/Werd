import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as DB from '../utils/DatabaseManager'
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

export interface DayData {
    intensity: number;
}
export interface MonthData {
    id: string;
    label: string;
    days: DayData[];
    year: number;
    monthIndex: number;
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Helper to ensure we ALWAYS get Gregorian date parts regardless of System Locale
const getGregorian = (date: Date) => {
    const s = date.toLocaleDateString('en-US', { calendar: 'gregory' }).split('/');
    return {
        month: parseInt(s[0]) - 1,
        day: parseInt(s[1]),
        year: parseInt(s[2])
    };
};

export const useStreak = () => {
    const [streak, setStreak] = useState<number>(0);
    const [longest, setlongest] = useState<number>(0);
    const [lastCompleted, setLastCompleted] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [heatmapData, setHeatmapData] = useState<MonthData[]>([]);
    const { t, i18n } = useTranslation();

    const oneDayInMs = 24 * 60 * 60 * 1000;

    const fetchHeatmapData = useCallback(async () => {
        // const now = new Date();
        // const { year: currentYear, month: currentMonth } = getGregorian(now);

        // const monthPromises = Array.from({ length: 6 }, (_, i) => {
        //     // Calculate previous months safely in Gregorian
        //     const d = new Date(currentYear, currentMonth - i, 1);
        //     const { year, month: monthIndex } = getGregorian(d);
            
        //     return DB.getDates(year, monthIndex).then(dbDates => ({

        const today = new Date();
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth()        
        const monthPromises = Array.from({ length : 6}, (_, i) => {
            let targetMonth = currentMonth-i
            let targetYear = currentYear
            if (targetMonth < 0) {
                targetMonth += 12
                --targetYear
            }
            return DB.getDates(targetYear, targetMonth).then(dbDates => ({
                dbDates: dbDates as DB.DateData[],
                year: targetYear,
                monthIndex: targetMonth
            }));
        });

        const results = await Promise.all(monthPromises);

        const monthsToLoad: MonthData[] = results.map(({ dbDates, year, monthIndex }) => {
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            const completedDays = new Set(dbDates.map(d => d.day));

            const days: DayData[] = Array.from({ length: daysInMonth }, (_, index) => ({
                intensity: completedDays.has(index + 1) ? 1 : 0
            }));

            return {
                id: `${MONTH_NAMES[monthIndex]}-${year}`,
                label: `${t(MONTH_NAMES[monthIndex])} ${year}`,
                days,
                year,
                monthIndex
            };
        });

        setHeatmapData([...monthsToLoad].reverse());
    }, [t, i18n.language]);

    const getTimeStamp = (dateInput?: string | Date) => {
        const date = dateInput ? new Date(dateInput) : new Date();
        const { year, month, day } = getGregorian(date);
        return new Date(year, month, day).getTime();
    };

    const ResetStreak = useCallback(async (UpdateHeatmap = false) => {
        const savedData = await DB.getStreak();
        if (UpdateHeatmap) await fetchHeatmapData();

        if (!savedData) {
            setLoading(false);
            return;
        }

        const today = getTimeStamp();
        const lastDate = getTimeStamp(savedData.date!);
        const diffInMs = today - lastDate;

        if (diffInMs > oneDayInMs) {
            setStreak(0);
        } else {
            setStreak(savedData.count);
        }

        setlongest(savedData.longest || 0);
        setLastCompleted(savedData.date);
        setLoading(false);
    }, [fetchHeatmapData, oneDayInMs]);

    useEffect(() => {
        const init = async () => {
            await ResetStreak(true);
        };
        init();

        const interval = setInterval(() => {
            ResetStreak(false);
        }, 5000);

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                ResetStreak(true);
            }
        });

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [ResetStreak]);

    const incrementStreak = useCallback(async () => {
        const savedData = await DB.getStreak();
        const currentStreak = savedData?.count || 0;
        const currentLongest = savedData?.longest || 0;
        const currentLastCompleted = savedData?.date || null;

        const now = new Date();
        const { year, month, day } = getGregorian(now);
        const today = getTimeStamp(now);
        const lastDate = currentLastCompleted ? getTimeStamp(currentLastCompleted) : null;

        const diffInMs = lastDate !== null ? today - lastDate : null;

        if (diffInMs === 0) {
            return;
        }

        // Use Gregorian units for DB insert
        await DB.insertDate(day, month, year, 1);

        let newStreak: number;
        if (diffInMs === oneDayInMs || currentLastCompleted === null) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = 1;
        }

        const newLongest = newStreak > currentLongest ? newStreak : currentLongest;

        const updatedData: DB.StreakData = {
            count: newStreak,
            date: now.toISOString(),
            longest: newLongest
        };

        await DB.updateStreak(updatedData);
        setStreak(newStreak);
        setlongest(newLongest);
        setLastCompleted(updatedData.date);

        await fetchHeatmapData();
    }, [oneDayInMs, fetchHeatmapData]);

    return { streak, incrementStreak, longest, loading, heatmapData };
};
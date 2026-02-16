import { useState, useEffect, useCallback} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as DB from '../utils/DatabaseManager'

export interface DayData{
    intensity: number;
}
export interface MonthData{
    id: string;
    label: string;
    days: DayData[];
    year: number;
    monthIndex: number;
}

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export const useStreak = () => {
    const [streak, setStreak] = useState<number>(0);
    const [longest, setlongest] = useState<number>(0);
    const [lastCompleted, setLastCompleted] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [heatmapData, setHeatmapData] = useState<MonthData[]>([]);

    const oneDayInMs = 24 * 60 * 60 * 1000;

    const fetchHeatmapData = useCallback(async () => {
        const today = new Date();
        const monthsToLoad: MonthData[] = [];

        for(let i = 0; i < 6; i++){
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = d.getFullYear();
            const monthIndex = d.getMonth();

            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

            const dbDates = await DB.getDates(year, monthIndex) as DB.DateData[];

            const completedDays = new Set(dbDates.map(d => d.day));

            const days: DayData[] = Array.from({ length: daysInMonth}, (_, index) =>{
                const dayNumber = index + 1;
                return {
                    intensity: completedDays.has(dayNumber) ? 1 : 0
                };
            });

            monthsToLoad.push({
                id: `${MONTH_NAMES[monthIndex]}-${year}`,
                label: `${MONTH_NAMES[monthIndex]} ${year}`,
                days,
                year,
                monthIndex
            });
        }

        setHeatmapData(monthsToLoad.reverse());
    }, []);

    const getTimeStamp = (dateInput?: string | Date) => {
        const date = dateInput ? new Date(dateInput) : new Date();
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    };


    const ResetStreak = useCallback(async (UpdateHeatmap = false) => {
        const savedData = await DB.getStreak();
        if(UpdateHeatmap)await fetchHeatmapData();

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
    }, [fetchHeatmapData]);

    useEffect(() => {
            const init = async() => {
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
        const today = getTimeStamp(now);
        const lastDate = currentLastCompleted ? getTimeStamp(currentLastCompleted) : null;
        
        const diffInMs = lastDate !== null ? today - lastDate : null;

        if (diffInMs === 0) {
            console.log("Already completed today");
            return;
        }

        await DB.insertDate(now.getDate(), now.getMonth(), now.getFullYear(), 1);

        let newStreak: number;

        if (diffInMs === oneDayInMs || currentLastCompleted === null) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = 1;
        }

        const newLongest = newStreak > currentLongest ? newStreak : currentLongest;

        const updatedData : DB.StreakData = { 
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
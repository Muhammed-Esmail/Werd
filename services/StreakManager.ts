import { useState, useEffect, useCallback} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as DB from '../utils/DatabaseManager'

export const useStreak = () => {
    const [streak, setStreak] = useState<number>(0);
    const [longest, setlongest] = useState<number>(0);
    const [lastCompleted, setLastCompleted] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const getTimeStamp = (dateInput?: string | Date) => {
        const date = dateInput ? new Date(dateInput) : new Date();
        // Sets seconds and milliseconds to 0 for strict minute-to-minute comparison
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0).getTime();
    };

    const oneDayInMs = 60 * 1000;

    const ResetStreak = useCallback(async () => {
        const savedData = await DB.getStreak();
        
        if (!savedData) {
            setLoading(false);
            return;
        }

        const today = getTimeStamp();
        const lastDate = getTimeStamp(savedData.date!);
        const diffInMs = today - lastDate;

        // If more than 1 minute has passed since the LAST minute, reset
        if (diffInMs > oneDayInMs) {
            setStreak(0);
        } else {
            setStreak(savedData.count);
        }
        
        setlongest(savedData.longest || 0);
        setLastCompleted(savedData.date);
        setLoading(false);
    }, []);

    useEffect(() => {
            const init = async() => {
                await ResetStreak();
                setLoading(false);
            };
            init();
            const interval = setInterval(() => {
                ResetStreak();
            }, 5000);
            const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
                if (nextAppState === 'active') {
                    ResetStreak();
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

        if (diffInMs === 0) return;

        let newStreak: number;

        if (diffInMs === oneDayInMs || currentLastCompleted === null) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = 1;
        }

        const newLongest = newStreak > currentLongest ? newStreak : currentLongest;

        const updatedData = { 
            count: newStreak, 
            date: now.toISOString(), 
            longest: newLongest
        };
        
        await DB.updateStreak(updatedData);

        setStreak(newStreak);
        setlongest(newLongest);
        setLastCompleted(updatedData.date);
        
    }, [oneDayInMs]);

    return { streak, incrementStreak, longest, loading };
}
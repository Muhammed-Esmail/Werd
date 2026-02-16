import { useState, useEffect, useCallback} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as DB from '../utils/DatabaseManager'

interface StreakData {
    count: number;
    date: string | null;
}

export const useStreak = () => {
    const [streak, setStreak] = useState<number>(0);
    const [lastCompleted, setLastCompleted] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const getTimeStamp = (dateInput?: string | Date) => {
        const date = dateInput ? new Date(dateInput) : new Date();
        
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()).getTime();
    };

    
    const oneDayInMs = 60 * 1000;
    const ResetStreak = useCallback(async () => {
        const savedData = await DB.getStreak();
        if(!savedData) return;
        const parsed = JSON.parse(savedData) as StreakData;
        const today = getTimeStamp();
        const lastDate = getTimeStamp(parsed.date!);
        const diffInMs = today - lastDate;
        if(diffInMs > oneDayInMs)setStreak(0);
        else setStreak(parsed.count);
        setLastCompleted(parsed.date);
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
        const now = new Date();
        const today = getTimeStamp(now);

        setStreak((prevStreak) => {
            let newStreak = prevStreak;
            const lastDate = lastCompleted ? getTimeStamp(lastCompleted) : null;
            
            const diffInMs = lastDate ? today - lastDate : null;

            if (diffInMs === 0) return prevStreak;

            if (diffInMs === oneDayInMs || lastCompleted === null) {
                newStreak = prevStreak + 1;
            } 
            else {
                newStreak = 1;
            }

            const updatedData: StreakData = { 
                count: newStreak, 
                date: now.toISOString() 
            };
            
            
            // AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));
            setLastCompleted(updatedData.date);
            
            return newStreak;
        });
    }, [streak, lastCompleted]);
    return { streak, incrementStreak, loading };
}
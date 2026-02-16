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
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()).getTime();
    };

    
    const oneDayInMs = 60 * 1000;
    const ResetStreak = useCallback(async () => {
        const savedData = await DB.getStreak();
        if(!savedData){
            setLoading(false);
            return;
        }

        const today = getTimeStamp();
        const lastDate = getTimeStamp(savedData.date!);
        const diffInMs = today - lastDate;
        if(diffInMs > oneDayInMs)setStreak(0);
        else setStreak(savedData.count);
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
        const now = new Date();
        const today = getTimeStamp(now);

        let newStreak = streak;
        const lastDate = lastCompleted ? getTimeStamp(lastCompleted) : null;
        
        const diffInMs = lastDate ? today - lastDate : null;

        if (diffInMs === 0) return streak;

        if (diffInMs === oneDayInMs || lastCompleted === null) {
            newStreak += 1;
        } 
        else {
            newStreak = 1;
        }

        const newLongest = newStreak > longest ? newStreak : longest;
        const updatedData: DB.StreakData = { 
            count: newStreak, 
            date: now.toISOString(), 
            longest: newLongest
        };
        
        
        await DB.updateStreak(updatedData);
        setStreak(newStreak);
        setlongest(newLongest);
        setLastCompleted(updatedData.date);
        
    }, [streak, lastCompleted, longest]);
    return { streak, incrementStreak, longest, loading };
}
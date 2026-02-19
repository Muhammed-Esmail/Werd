import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import * as DatabaseManager from '@/utils/DatabaseManager';



Notifications.setNotificationHandler({
    handleNotification: async () => {
        return ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        });
    },
});


const NOTIFICATION_MESSAGES = [
    {
        title: "Time for your daily Werd! 📖",
        body: "A few minutes of reading can brighten your day"
    },
    {
        title: "Your Werd is waiting! 📚",
        body: "Stay consistent with your reading habit"
    },
    {
        title: "Daily reminder 🕌",
        body: "Take a moment to read your Werd today"
    },
    {
        title: "Keep going! 💪",
        body: "Your daily Werd is ready for you"
    },
];

const getStreakMessage = (streakDays: number) => {
    if (streakDays == 0) {
        return {
            title: "Start your streak today! 🌟",
            body: "Begin your journey with today's Werd"
        };
    } else if (streakDays < 7) {
        return {
            title: `Day ${streakDays} streak! 🔥`,
            body: "Keep the momentum going with today's Werd"
        };
    } else if (streakDays < 30) {
        return {
            title: `Amazing ${streakDays}-day streak! 🎉`,
            body: "Don't break your streak !!!!!"
        };
    } else {
        return {
            title: `Incredible ${streakDays} streak! 🏆`,
            body: "You're on fire! Keep your streak alive"
        };
    }
};

const getCurrentStreakFromDB = async (): Promise<number> => {
    try {
        const streakData = await DatabaseManager.getStreak();
        if (!streakData) {
            console.log(' No streak data found in database');
            return 0;
        }
        console.log(`Current streak from DB: ${streakData.count} days`);
        return streakData.count;
    } catch (error) {
        console.error('Failed to get streak from database :(', error);
        return 0;
    }
}

export const requestPermissions = async (): Promise<boolean> => {
    try {
        const {status: existingStatus} = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('️ Notification permission denied');
            return false;
        }

        console.log(' Notification permission granted');
        return true;

    } catch (error) {
        console.error(' Failed to request notification permissions:', error);
        return false;
    }
};

export const hasPermissions = async (): Promise<boolean> => {
    const {status} = await Notifications.getPermissionsAsync();
    return status === 'granted';
};
/**
 * Schedule daily Werd reminder
 * Automatically fetches current streak for personalization
 *
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 * @param cancelExisting - Whether to cancel existing notifications first (default: true)
 */
export const scheduleDailyReminder = async (
    hour: number = 20,
    minute: number = 0,
    cancelExisting: boolean = true
): Promise<string | null> => {
    try {
        // Cancel any existing notifications first
        if (cancelExisting) {
            await cancelAllNotifications();
        }


        // Check permissions
        const hasPermission = await hasPermissions();
        if (!hasPermission) {
            const granted = await requestPermissions();
            if (!granted) {
                console.log(' Cannot schedule notification without permission');
                return null;
            }
        }

        const streakDays = await getCurrentStreakFromDB();
        console.log(` Scheduling notification with ${streakDays}-day streak`);


        const notification = getStreakMessage(streakDays);


        const trigger: any = Platform.OS === 'android'
            ? {
                type: 'daily' as const,
                hour: hour,
                minute: minute,
            }
            : {
                type: 'calendar' as const,
                hour: hour,
                minute: minute,
                repeats: true,
            };

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.title,
                body: notification.body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: trigger,
        });

        console.log(` Daily reminder scheduled for ${hour}:${minute < 10 ? '0' : ''}${minute}`);
        console.log(`   With ${streakDays}-day streak personalization`);
        console.log(`   Notification ID: ${notificationId}`);

        return notificationId;

    } catch (error) {
        console.error(' Failed to schedule notification:', error);
        return null;
    }
};


export const scheduleTestNotification = async (
    seconds: number = 5,
    streakDays?: number
): Promise<string | null> => {
    try {
        const hasPermission = await hasPermissions();
        if (!hasPermission) {
            const granted = await requestPermissions();
            if (!granted) {
                console.log(' Cannot schedule test notification without permission');
                return null;
            }
        }

        // Get streak from DB if not provided
        const actualStreak = streakDays !== undefined ? streakDays : await getCurrentStreakFromDB();

        // Choose message
        const notification = getStreakMessage(actualStreak);

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.title,
                body: notification.body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                type: 'timeInterval',
                seconds: seconds,
            },
        });

        console.log(` Test notification scheduled for ${seconds} seconds from now`);
        console.log(`   With ${actualStreak}-day streak message`);
        console.log(`   Notification ID: ${notificationId}`);

        return notificationId;

    } catch (error) {
        console.error(' Failed to schedule test notification:', error);
        return null;
    }
};

export const cancelAllNotifications = async (): Promise<void> => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log(' All notifications cancelled');
    } catch (error) {
        console.error(' Failed to cancel notifications:', error);
    }
};


export const getAllScheduledNotifications = async () => {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log(` Scheduled notifications: ${notifications.length}`);
        notifications.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.content.title} - ${notif.identifier}`);
        });
        return notifications;
    } catch (error) {
        console.error(' Failed to get scheduled notifications:', error);
        return [];
    }
};
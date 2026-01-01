
'use server';
import { firestore } from '@/firebase/server';
import { collection, addDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';

type CreateNotificationParams = {
    userId: string;
    message: string;
    href: string;
};

export async function createNotification({ userId, message, href }: CreateNotificationParams) {
    if (!userId || !message || !href) {
        console.error("Missing required fields for notification");
        return;
    }

    try {
        const notificationsCol = collection(firestore, 'users', userId, 'notifications');
        await addDoc(notificationsCol, {
            userId,
            message,
            href,
            createdAt: serverTimestamp(),
            read: false
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}


type SendNotificationParams = {
    message: string;
    href: string;
    target: 'all' | 'single';
    userId?: string;
};

export async function sendNotification(params: SendNotificationParams): Promise<{success: boolean, message: string}> {
    const { message, href, target, userId } = params;

    if (!message || !href) {
        return { success: false, message: 'Message and link are required.' };
    }

    try {
        if (target === 'single' && userId) {
            // Send to a single user
            await createNotification({ userId, message, href });
        } else if (target === 'all') {
            // Send to all users
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            if (usersSnapshot.empty) {
                return { success: false, message: 'No users found to send notifications to.' };
            }

            const batch = writeBatch(firestore);
            usersSnapshot.forEach(userDoc => {
                const userNotificationsCol = collection(firestore, 'users', userDoc.id, 'notifications');
                const newNotifRef = doc(userNotificationsCol);
                batch.set(newNotifRef, {
                    userId: userDoc.id,
                    message,
                    href,
                    createdAt: serverTimestamp(),
                    read: false,
                });
            });
            await batch.commit();
        } else {
            return { success: false, message: 'Invalid target or missing user ID for single notification.' };
        }
        
        return { success: true, message: 'Notification(s) sent successfully.' };

    } catch (error: any) {
        console.error('Error sending notification(s):', error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}


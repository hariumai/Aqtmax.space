
'use server';
import { firestore } from '@/firebase/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

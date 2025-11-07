'use server';

import { revalidatePath } from 'next/cache';
import {
    markAsRead as markAsReadService,
    markAllAsRead as markAllAsReadService,
    deleteNotification as deleteNotificationService,
} from '@/services/notification.service';

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number) {
    try {
        const result = await markAsReadService(notificationId);
        if (!result) {
            throw new Error('Failed to mark notification as read');
        }
        revalidatePath('/notifications');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
    try {
        const result = await markAllAsReadService(userId);
        if (!result) {
            throw new Error('Failed to mark all notifications as read');
        }
        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number) {
    try {
        const result = await deleteNotificationService(notificationId);
        if (!result) {
            throw new Error('Failed to delete notification');
        }
        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: (error as Error).message };
    }
}

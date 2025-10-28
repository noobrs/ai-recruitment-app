import { createClient } from '@/utils/supabase/server';
import { Notification, NotificationType, NotificationInsert } from '@/types';

/**
 * Get a notification by ID
 */
export async function getNotificationById(notificationId: number): Promise<Notification | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('notification_id', notificationId)
        .single();

    if (error) {
        console.error('Error fetching notification:', error);
        return null;
    }
    return data;
}

/**
 * Get all notifications for a user
 */
export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .is('opened_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
    }
    return data || [];
}

/**
 * Get notifications by type
 */
export async function getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications by type:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new notification
 */
export async function createNotification(notification: NotificationInsert): Promise<Notification | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification')
        .insert(notification)
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        return null;
    }
    return data;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: number): Promise<Notification | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notification')
        .update({ opened_at: new Date().toISOString() })
        .eq('notification_id', notificationId)
        .select()
        .single();

    if (error) {
        console.error('Error marking notification as read:', error);
        return null;
    }
    return data;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('notification')
        .update({ opened_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('opened_at', null);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
    return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('notification')
        .delete()
        .eq('notification_id', notificationId);

    if (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
    return true;
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('notification')
        .delete()
        .eq('user_id', userId)
        .not('opened_at', 'is', null);

    if (error) {
        console.error('Error deleting read notifications:', error);
        return false;
    }
    return true;
}

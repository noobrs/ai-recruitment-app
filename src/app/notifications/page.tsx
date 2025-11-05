import { redirect } from 'next/navigation';
import { getCurrentUser, getNotificationsByUserId } from '@/services';
import NotificationsClient from '@/components/notifications/NotificationsClient';

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch initial notifications server-side
  const initialNotifications = await getNotificationsByUserId(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
        <NotificationsClient
          userId={user.id}
          initialNotifications={initialNotifications}
        />
      </div>
    </div>
  );
}

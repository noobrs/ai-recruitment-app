'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export default function NotificationTestPage() {
  const [message, setMessage] = useState('This is a test notification');
  const [type, setType] = useState<'resume' | 'application' | 'general'>('general');
  const [loading, setLoading] = useState(false);

  const createTestNotification = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Create notification
      const { data, error } = await supabase
        .from('notification')
        .insert({
          user_id: user.id,
          message,
          type,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Test notification created!');
      console.log('Created notification:', data);
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error('Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Notification Creator
          </h1>

          <div className="space-y-4">
            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter notification message..."
              />
            </div>

            {/* Type Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'resume' | 'application' | 'general')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="general">General</option>
                <option value="resume">Resume</option>
                <option value="application">Application</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={createTestNotification}
              disabled={loading || !message}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Test Notification'}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Testing Instructions:
            </h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Click the button to create a test notification</li>
              <li>Watch the bell icon update in real-time</li>
              <li>See the toast appear at bottom-right</li>
              <li>Hover over the bell to see preview</li>
              <li>Navigate to /notifications to see full list</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="mt-4 space-y-2">
            <a
              href="/notifications"
              className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go to Notifications Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

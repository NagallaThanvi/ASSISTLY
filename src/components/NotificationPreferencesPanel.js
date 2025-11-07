import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const NotificationPreferencesPanel = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    requestUpdates: true,
    communityAnnouncements: true,
    chatMessages: true,
    weeklyDigest: false
  });

  useEffect(() => {
    // Load saved preferences from user profile if they exist
    const loadPreferences = async () => {
      try {
        // Implementation for loading preferences from backend
        // This would typically fetch from your Firebase database
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    if (user) {
      loadPreferences();
    }
  }, [user]);

  const handlePreferenceChange = async (key) => {
    try {
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key]
      };
      setPreferences(newPreferences);
      
      // Here you would typically save to backend
      // await savePreferencesToDatabase(user.uid, newPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  return (
    <div className="notification-preferences-panel">
      <h2>Notification Preferences</h2>
      <div className="preferences-list">
        {Object.entries(preferences).map(([key, value]) => (
          <div key={key} className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handlePreferenceChange(key)}
              />
              {key.split(/(?=[A-Z])/).join(' ')}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPreferencesPanel;
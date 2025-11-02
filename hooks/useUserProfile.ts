import { useState, useCallback } from 'react';

export interface UserProfile {
  name: string;
  isActive: boolean;
  isExecutionEnabled: boolean;
  primaryBroker: string;
  restrictedSymbols: string[];
}

export interface ProfileErrors {
  name?: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    isActive: false,
    isExecutionEnabled: false,
    primaryBroker: '',
    restrictedSymbols: [],
  });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [loading, setLoading] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounts/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.name || '',
          isActive: data.isActive,
          isExecutionEnabled: data.isExecutionEnabled,
          primaryBroker: data.primaryBroker || '',
          restrictedSymbols: data.restrictedSymbols || [],
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounts/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await response.json(); // Profile updated successfully
        setProfile(prev => ({
          ...prev,
          ...updates,
        }));
        setProfileErrors({});
        return { success: true };
      } else {
        const error = await response.json();
        setProfileErrors(error.errors || { name: 'Failed to update profile' });
        return { success: false, error };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileErrors({ name: 'Network error occurred' });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    profileErrors,
    loading,
    fetchUserProfile,
    updateProfile,
    setProfileErrors,
  };
}
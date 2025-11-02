import { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/notifications';
import BrokerSelect from '@/components/BrokerSelect';
import { UserProfile, ProfileErrors, AngelOneProfile } from '@/hooks/useUserProfile';
import { TradingAccount } from '@/lib/types';

interface ProfileSectionProps {
  profile: UserProfile;
  angelOneProfile: AngelOneProfile | null;
  profileErrors: ProfileErrors;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: unknown }>;
  onProfileErrorsChange: (errors: ProfileErrors) => void;
  onProfileRefresh: () => Promise<void>;
  onFetchAngelOneProfile: (accountName: string) => Promise<{ success: boolean; error?: string; profile?: AngelOneProfile }>;
  accounts: TradingAccount[];
}

export default function ProfileSection({
  profile,
  angelOneProfile,
  profileErrors,
  onProfileUpdate,
  onProfileErrorsChange,
  onProfileRefresh,
  onFetchAngelOneProfile,
  accounts,
}: ProfileSectionProps) {
  const { addNotification } = useNotifications();
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [newSymbol, setNewSymbol] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  // Sync local state with props
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const addRestrictedSymbol = () => {
    if (newSymbol.trim() && !localProfile.restrictedSymbols.includes(newSymbol.trim())) {
      setLocalProfile({
        ...localProfile,
        restrictedSymbols: [...localProfile.restrictedSymbols, newSymbol.trim()],
      });
      setNewSymbol('');
    }
  };

  const removeRestrictedSymbol = (symbol: string) => {
    setLocalProfile({
      ...localProfile,
      restrictedSymbols: localProfile.restrictedSymbols.filter(s => s !== symbol),
    });
  };

  const handleFetchAngelOneProfile = async () => {
    if (!selectedAccount) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select an account to fetch profile.',
      });
      return;
    }

    const result = await onFetchAngelOneProfile(selectedAccount);
    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Profile Fetched',
        message: 'AngelOne profile data has been fetched and stored successfully.',
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: result.error || 'Failed to fetch AngelOne profile.',
      });
    }
  };

  const handleUpdateProfile = async () => {
    // Validate required fields
    const errors: ProfileErrors = {};
    if (!localProfile.name.trim()) {
      errors.name = 'Full Name is required';
    }

    onProfileErrorsChange(errors);

    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = await onProfileUpdate(localProfile);

    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
      });
      onProfileErrorsChange({}); // Clear errors on success
      await onProfileRefresh(); // Refresh the profile data
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update profile.',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localProfile.name}
              onChange={(e) => {
                setLocalProfile({ ...localProfile, name: e.target.value });
                // Clear error when user starts typing
                if (profileErrors.name) {
                  onProfileErrorsChange({ ...profileErrors, name: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                profileErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {profileErrors.name && (
              <p className="text-sm text-red-600">{profileErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Primary Broker</label>
            <BrokerSelect
              value={localProfile.primaryBroker}
              onChange={(value) => setLocalProfile({ ...localProfile, primaryBroker: value })}
              className="w-full"
              placeholder="Select Primary Broker"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Automatic Trade Execution</label>
              <p className="text-xs text-gray-500">Enable automated order execution for signals</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localProfile.isExecutionEnabled}
                onChange={(e) => setLocalProfile({ ...localProfile, isExecutionEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Restricted Symbols</label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Add symbol (e.g., RELIANCE)"
            />
            <button
              onClick={addRestrictedSymbol}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localProfile.restrictedSymbols.map(symbol => (
              <span
                key={symbol}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 border border-red-200"
              >
                {symbol}
                <button
                  onClick={() => removeRestrictedSymbol(symbol)}
                  className="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleUpdateProfile}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* AngelOne Profile Section */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">AngelOne Profile</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          >
            <option value="">Choose an account...</option>
            {accounts.filter(account => account.broker === 'angelone').map(account => (
              <option key={account.id} value={account.name}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <button
            onClick={handleFetchAngelOneProfile}
            disabled={!selectedAccount}
            className="w-full sm:w-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fetch Profile Data
          </button>
        </div>

        {angelOneProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Code</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{angelOneProfile.clientcode || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{angelOneProfile.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{angelOneProfile.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{angelOneProfile.mobileno || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Broker ID</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{angelOneProfile.brokerid || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{angelOneProfile.lastlogintime || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Enabled Exchanges</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {angelOneProfile.exchanges.map(exchange => (
                    <span key={exchange} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {exchange}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Enabled Products</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {angelOneProfile.products.map(product => (
                    <span key={product} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
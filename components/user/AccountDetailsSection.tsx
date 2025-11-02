import { useState } from 'react';
import { TradingAccount } from '@/lib/types';
import { UserProfile } from '@/hooks/useUserProfile';
import { useNotifications } from '@/lib/notifications';

interface AccountDetailsSectionProps {
  accounts: TradingAccount[];
  profile: UserProfile;
  selectedAccountId: string;
  onSelectedAccountIdChange: (accountId: string) => void;
  onLoadSignals: (accountId: string) => void;
  onLoadOrderBook: (account: TradingAccount) => void;
  onLoadTradeBook: (account: TradingAccount) => void;
}

export default function AccountDetailsSection({
  accounts,
  profile,
  selectedAccountId,
  onSelectedAccountIdChange,
  onLoadSignals,
  onLoadOrderBook,
  onLoadTradeBook,
}: AccountDetailsSectionProps) {
  const { addNotification } = useNotifications();
  const [totp, setTotp] = useState('');

  const generateToken = async (account: TradingAccount) => {
    console.log('🎯 [Frontend] Generate token clicked for account:', account.name);

    if (!totp) {
      console.log('❌ [Frontend] TOTP is empty');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your TOTP code to generate token.',
      });
      return;
    }

    console.log('📤 [Frontend] Preparing API request');
    const requestData = {
      client_code: account.clientCode,
      client_pin: account.userPin,
      totp,
      apiKey: account.apiKey,
      accountId: account.id, // Use ID instead of name for reliable database lookup
    };

    console.log('📤 [Frontend] Sending request data:', {
      client_code: requestData.client_code,
      client_pin: requestData.client_pin ? '***' : undefined,
      totp: requestData.totp ? '***' : undefined,
      apiKey: requestData.apiKey ? '***' : undefined,
      accountId: requestData.accountId,
    });

    try {
      console.log('🌐 [Frontend] Making API call to /api/auth/angel_one/generate/token');
      const response = await fetch('/api/auth/angel_one/generate/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      console.log('📥 [Frontend] API response status:', response.status);
      let result;
      const contentType = response.headers.get('content-type');
      console.log('📥 [Frontend] Response content-type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('📥 [Frontend] Parsed JSON response:', result);
      } else {
        // Handle plain text responses
        const textResult = await response.text();
        console.log('📥 [Frontend] Plain text response:', textResult);

        if (response.ok) {
          result = { ok: true, message: textResult };
        } else {
          result = { ok: false, error: textResult };
        }
      }

      if (result.ok) {
        console.log('✅ [Frontend] Token generation successful');
        addNotification({
          type: 'success',
          title: 'Token Generated',
          message: 'Authentication token has been generated successfully.',
        });
        // Refresh account data will be handled by parent
      } else {
        console.log('❌ [Frontend] Token generation failed:', result.error);
        addNotification({
          type: 'error',
          title: 'Token Generation Failed',
          message: result.error || 'Failed to generate token.',
        });
      }
    } catch (error) {
      console.error('❌ [Frontend] Network error during token generation:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server. Please try again.',
      });
    }
  };

  const handleAccountChange = (accountId: string) => {
    onSelectedAccountIdChange(accountId);
    if (accountId) {
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        onLoadSignals(accountId);
        onLoadOrderBook(account);
        onLoadTradeBook(account);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Token Generator</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
            <select
              value={selectedAccountId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onChange={(e) => handleAccountChange(e.target.value)}
            >
              <option value="">Choose an account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAccountId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Authentication</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter 6-digit TOTP"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={() => {
                    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
                    if (selectedAccount) {
                      generateToken(selectedAccount);
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Generate Token
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-t border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{accounts.length}</div>
              <div className="text-sm text-gray-500">Total Accounts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{accounts.filter(acc => acc.isActive).length}</div>
              <div className="text-sm text-gray-500">Active Accounts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.restrictedSymbols.length}</div>
              <div className="text-sm text-gray-500">Restricted Symbols</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{profile.isExecutionEnabled ? 'ON' : 'OFF'}</div>
              <div className="text-sm text-gray-500">Auto Execution</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { TradingAccount } from '@/lib/types';
import { useNotifications } from '@/lib/notifications';
import BrokerSelect from '@/components/BrokerSelect';
import { NewAccountData } from '@/hooks/useTradingAccounts';

interface AccountsSectionProps {
  accounts: TradingAccount[];
  onAccountsChange: () => void;
  onToggleActive: (accountId: string) => void;
}

export default function AccountsSection({
  accounts,
  onAccountsChange,
  onToggleActive,
}: AccountsSectionProps) {
  const { data: session, status } = useSession();
  const { addNotification } = useNotifications();
  const [newAccount, setNewAccount] = useState<NewAccountData>({
    broker: '',
    clientCode: '',
    apiKey: '',
    userPin: '',
    name: '',
  });

  const addAccount = async () => {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount),
    });
    if (response.ok) {
      setNewAccount({ broker: '', clientCode: '', apiKey: '', userPin: '', name: '' });
      onAccountsChange();
      addNotification({
        type: 'success',
        title: 'Account Added',
        message: 'Trading account has been added successfully.',
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add trading account.',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Trading Accounts</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">{accounts.filter(acc => acc.isActive).length} Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700">{accounts.filter(acc => !acc.isActive).length} Inactive</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Debug Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>Session Status: {status}</p>
            <p>User ID: {session?.user?.id || 'Not logged in'}</p>
            <p>User Email: {session?.user?.email || 'Not logged in'}</p>
            <p>User Role: {session?.user?.role || 'Not logged in'}</p>
            <p>Total Accounts: {accounts.length}</p>
            <p>Active Accounts: {accounts.filter(acc => acc.isActive).length}</p>
          </div>
        </div>

        {/* Add Account Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Account Name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <BrokerSelect
              value={newAccount.broker}
              onChange={(value) => setNewAccount({ ...newAccount, broker: value })}
              className="w-full"
              placeholder="Select Broker"
            />
            <input
              type="text"
              placeholder="Client Code"
              value={newAccount.clientCode}
              onChange={(e) => setNewAccount({ ...newAccount, clientCode: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              placeholder="API Key"
              value={newAccount.apiKey}
              onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <input
              type="password"
              placeholder="User PIN"
              value={newAccount.userPin}
              onChange={(e) => setNewAccount({ ...newAccount, userPin: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={addAccount}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Add Account
            </button>
          </div>
        </div>

        {/* Account List */}
        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Trading Accounts</h3>
              <p className="text-gray-500 mb-4">You haven&apos;t added any trading accounts yet. Add your first account to start trading.</p>
            </div>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${acc.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{acc.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{acc.broker}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right text-sm text-gray-500">
                      <p>Last used: {acc.lastUsed ? new Date(acc.lastUsed).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <button
                      onClick={() => onToggleActive(acc.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        acc.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {acc.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/lib/notifications';
import Header from '@/components/Header';

// Custom hooks
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTradingAccounts } from '@/hooks/useTradingAccounts';
import { useAccountData } from '@/hooks/useAccountData';

// Components
import AccessDenied from '@/components/user/AccessDenied';
import ProfileSection from '@/components/user/ProfileSection';
import AccountsSection from '@/components/user/AccountsSection';
import AccountDetailsSection from '@/components/user/AccountDetailsSection';
import AccountDataSection from '@/components/user/AccountDataSection';
import ConfirmationDialog from '@/components/user/ConfirmationDialog';
import TokenRegenerationDialog from '@/components/user/TokenRegenerationDialog';

export default function UserPage() {
  const { data: session, status } = useSession();
  const { addNotification } = useNotifications();

  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<'profile' | 'accounts' | 'details' | 'data'>('profile');

  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'activate' | 'deactivate' | null>(null);

  // Token regeneration state
  const [showTokenRegeneration, setShowTokenRegeneration] = useState(false);
  const [tokenRegenerationAccount, setTokenRegenerationAccount] = useState<{ id: string; name: string } | null>(null);

  // Custom hooks
  const {
    profile,
    profileErrors,
    setProfileErrors,
    fetchUserProfile,
    updateProfile,
  } = useUserProfile();

  const {
    accounts,
    fetchAccounts,
  } = useTradingAccounts();

  const {
    activeTab,
    setActiveTab,
    selectedAccountId,
    setSelectedAccountId,
    accountSignals,
    orderBook,
    orderBookError,
    tradeBook,
    tradeBookError,
    loadingSignals,
    loadingOrderBook,
    loadingTradeBook,
    loadSignals,
    loadOrderBook,
    loadTradeBook,
    refreshActiveTab,
  } = useAccountData();

  // Load accounts and user profile from DB
  useEffect(() => {
    console.log('[User Page] useEffect triggered, session:', session);
    console.log('[User Page] session status:', status);
    if (session) {
      console.log('[User Page] Calling fetchAccounts and fetchUserProfile');
      fetchAccounts();
      fetchUserProfile();
    } else {
      console.log('[User Page] No session, not fetching data');
    }
  }, [session, status, fetchAccounts, fetchUserProfile]);

  // Auto-select first account when accounts load and user is on data section
  useEffect(() => {
    if (accounts.length > 0 && activeSection === 'data' && !selectedAccountId) {
      const firstAccount = accounts[0];
      setSelectedAccountId(firstAccount.id);
      loadSignals(firstAccount.id);
      loadOrderBook(firstAccount);
      loadTradeBook(firstAccount);
    }
  }, [accounts, activeSection, selectedAccountId, setSelectedAccountId, loadSignals, loadOrderBook, loadTradeBook]);

  // Loading state
  if (status === 'loading') return <div>Loading...</div>;

  // Access control
  if (!session) {
    return <AccessDenied reason="no-session" />;
  }

  if (session.user.role === 'super_admin') {
    return <AccessDenied reason="super-admin" />;
  }

  if (session.user.role === 'admin') {
    return <AccessDenied reason="admin" />;
  }

  if (profile && !profile.isActive) {
    return <AccessDenied reason="inactive" />;
  }

  // Dialog handlers
  const handleToggleActive = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    const action = account.isActive ? 'deactivate' : 'activate';
    setPendingAccountId(accountId);
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmToggleActive = async () => {
    if (!pendingAccountId || !pendingAction) return;

    const response = await fetch(`/api/accounts/${pendingAccountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: pendingAction === 'activate' }),
    });
    if (response.ok) {
      fetchAccounts();
      addNotification({
        type: 'success',
        title: 'Account Updated',
        message: `Trading account has been ${pendingAction}d successfully.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update trading account.',
      });
    }
    setShowConfirmDialog(false);
    setPendingAccountId(null);
    setPendingAction(null);
  };

  const handleRegenerateTokens = (accountId: string, accountName: string) => {
    setTokenRegenerationAccount({ id: accountId, name: accountName });
    setShowTokenRegeneration(true);
  };

  const handleConfirmTokenRegeneration = async () => {
    // This will be implemented in the dialog component
    // For now, just close the dialog
    setShowTokenRegeneration(false);
    setTokenRegenerationAccount(null);
  };

  console.log('[Frontend] UserPage component rendering');
  console.log('[Frontend] Session status:', status);
  console.log('[Frontend] Accounts count:', accounts.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl font-semibold text-gray-900">Trading Dashboard</div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, <span className="font-medium text-gray-900">{session.user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
              </div>
              <nav className="p-4 space-y-2">
                <button
                  onClick={() => setActiveSection('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'profile'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Settings</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('accounts')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'accounts'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Trading Accounts</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('details')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'details'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Token Generator</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('data')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'data'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Account Data</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {activeSection === 'profile' && (
              <ProfileSection
                profile={profile}
                profileErrors={profileErrors}
                onProfileUpdate={updateProfile}
                onProfileErrorsChange={setProfileErrors}
                onProfileRefresh={fetchUserProfile}
              />
            )}

            {activeSection === 'accounts' && (
              <AccountsSection
                accounts={accounts}
                onAccountsChange={fetchAccounts}
                onToggleActive={handleToggleActive}
              />
            )}

            {activeSection === 'details' && accounts.length > 0 && (
              <AccountDetailsSection
                accounts={accounts}
                profile={profile}
                selectedAccountId={selectedAccountId}
                onSelectedAccountIdChange={setSelectedAccountId}
                onLoadSignals={loadSignals}
                onLoadOrderBook={loadOrderBook}
                onLoadTradeBook={loadTradeBook}
              />
            )}

            {activeSection === 'data' && (
              <AccountDataSection
                accounts={accounts}
                activeTab={activeTab}
                selectedAccountId={selectedAccountId}
                accountSignals={accountSignals}
                orderBook={orderBook}
                orderBookError={orderBookError}
                tradeBook={tradeBook}
                tradeBookError={tradeBookError}
                loadingSignals={loadingSignals}
                loadingOrderBook={loadingOrderBook}
                loadingTradeBook={loadingTradeBook}
                onActiveTabChange={setActiveTab}
                onSelectedAccountIdChange={setSelectedAccountId}
                onLoadSignals={loadSignals}
                onLoadOrderBook={loadOrderBook}
                onLoadTradeBook={loadTradeBook}
                onRefreshActiveTab={refreshActiveTab}
                onRegenerateTokens={handleRegenerateTokens}
              />
            )}
          </div>
        </div>

        {/* Dialogs */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          action={pendingAction}
          onCancel={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmToggleActive}
        />

        <TokenRegenerationDialog
          isOpen={showTokenRegeneration}
          account={tokenRegenerationAccount}
          totp="" // This should be managed in the dialog or parent state
          onTotpChange={() => {}} // This needs to be implemented
          onCancel={() => {
            setShowTokenRegeneration(false);
            setTokenRegenerationAccount(null);
          }}
          onConfirm={handleConfirmTokenRegeneration}
        />
      </div>
    </div>
  );
}

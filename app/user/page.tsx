'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { TradingAccount, OrderBookEntry, TradeBookEntry, UserSignal } from '@/lib/types';
import { useNotifications } from '@/lib/notifications';
import BrokerSelect from '@/components/BrokerSelect';
import Header from '@/components/Header';

export default function UserPage() {
  const { data: session, status } = useSession();
  const { addNotification } = useNotifications();

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [profile, setProfile] = useState({
    name: '',
    isActive: false,
    isExecutionEnabled: false,
    primaryBroker: '',
    restrictedSymbols: [] as string[],
  });
  const [profileErrors, setProfileErrors] = useState<{ name?: string }>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [newAccount, setNewAccount] = useState({
    broker: '',
    clientCode: '',
    apiKey: '',
    userPin: '',
    name: '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'activate' | 'deactivate' | null>(null);

  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<'profile' | 'accounts' | 'details' | 'data'>('profile');

  // AngelOne specific state
  const [activeTab, setActiveTab] = useState<'signals' | 'orderbook' | 'tradebook'>('signals');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [totp, setTotp] = useState('');
  const [accountSignals, setAccountSignals] = useState<UserSignal[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookEntry[] | null>(null);
  const [orderBookError, setOrderBookError] = useState<string | { message: string; code?: string; accountId?: string; accountName?: string } | null>(null);
  const [tradeBook, setTradeBook] = useState<TradeBookEntry[] | null>(null);
  const [tradeBookError, setTradeBookError] = useState<string | { message: string; code?: string; accountId?: string; accountName?: string } | null>(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingOrderBook, setLoadingOrderBook] = useState(false);
  const [loadingTradeBook, setLoadingTradeBook] = useState(false);

  // Token regeneration state
  const [showTokenRegeneration, setShowTokenRegeneration] = useState(false);
  const [tokenRegenerationAccount, setTokenRegenerationAccount] = useState<{ id: string; name: string } | null>(null);
  const [regeneratingTokens, setRegeneratingTokens] = useState(false);

  const fetchAccounts = useCallback(async () => {
    console.log('📥 [Frontend] Fetching accounts from /api/accounts');
    try {
      const response = await fetch('/api/accounts');
      console.log('📥 [Frontend] Accounts API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📥 [Frontend] Accounts loaded:', data.length, 'accounts');
        console.log('📥 [Frontend] Account details:', data.map((acc: TradingAccount) => ({
          id: acc.id,
          name: acc.name,
          broker: acc.broker,
          clientCode: acc.clientCode ? '***' : null
        })));
        setAccounts(data);
      } else {
        console.log('❌ [Frontend] Failed to load accounts:', response.status);
      }
    } catch (error) {
      console.error('❌ [Frontend] Error fetching accounts:', error);
    }
  }, []);

  // Load accounts and user profile from DB
  useEffect(() => {
    console.log('🔍 [User Page] useEffect triggered, session:', session);
    console.log('🔍 [User Page] session status:', status);
    if (session) {
      console.log('🔍 [User Page] Calling fetchAccounts and fetchUserProfile');
      fetchAccounts();
      fetchUserProfile();
    } else {
      console.log('🔍 [User Page] No session, not fetching data');
    }
  }, [session, status, fetchAccounts]);

  // Auto-select first account when accounts load and user is on data section
  useEffect(() => {
    if (accounts.length > 0 && activeSection === 'data' && !selectedAccountId) {
      const firstAccount = accounts[0];
      setSelectedAccountId(firstAccount.id);
      loadSignals(firstAccount.id);
      loadOrderBook(firstAccount);
      loadTradeBook(firstAccount);
    }
  }, [accounts, activeSection, selectedAccountId]);

  const fetchUserProfile = async () => {
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
  };

  if (status === 'loading') return <div>Loading...</div>;

  if (!session) {
    return <div>Access denied. Please login first.</div>;
  }

  // Check if user is super admin - deny access to trading functionality
  if (session.user.role === 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-6-8v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Super administrators do not have access to trading account functionality.
            Please use the admin panel for user management.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is admin - deny access to trading functionality
  if (session.user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-6-8v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Administrators do not have access to trading account functionality.
            Please use the admin panel for user management.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is active
  if (profile && !profile.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently inactive and awaiting administrator approval.
            You will be able to access trading features once approved.
          </p>
          <div className="text-sm text-gray-500">
            Please contact the administrator if you have any questions.
          </div>
        </div>
      </div>
    );
  }

  const addAccount = async () => {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount),
    });
    if (response.ok) {
      setNewAccount({ broker: '', clientCode: '', apiKey: '', userPin: '', name: '' });
      fetchAccounts();
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

  const toggleActive = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;

    const action = account.isActive ? 'deactivate' : 'activate';
    setPendingAccountId(id);
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

  const confirmToggleActive = async () => {
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

  const loadOrderBook = async (account: TradingAccount) => {
    setLoadingOrderBook(true);
    setOrderBookError(null);
    try {
      const response = await fetch(
        `/api/auth/angel_one/get-order-book?accountName=${encodeURIComponent(account.name)}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrderBook(data);
      } else {
        const errorData = await response.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          setOrderBookError({
            message: errorData.error,
            code: errorData.code,
            accountId: errorData.accountId,
            accountName: errorData.accountName
          });
        } else {
          setOrderBookError(errorData.error || 'Failed to load order book');
        }
        setOrderBook(null);
      }
    } catch (error) {
      console.error('Failed to load order book:', error);
      setOrderBookError('Network error while loading order book');
      setOrderBook(null);
    } finally {
      setLoadingOrderBook(false);
    }
  };

  const loadTradeBook = async (account: TradingAccount) => {
    setLoadingTradeBook(true);
    setTradeBookError(null);
    try {
      const response = await fetch(
        `/api/auth/angel_one/get-trade-book?accountName=${encodeURIComponent(account.name)}`
      );
      if (response.ok) {
        const data = await response.json();
        setTradeBook(data);
      } else {
        const errorData = await response.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          setTradeBookError({
            message: errorData.error,
            code: errorData.code,
            accountId: errorData.accountId,
            accountName: errorData.accountName
          });
        } else {
          setTradeBookError(errorData.error || 'Failed to load trade book');
        }
        setTradeBook(null);
      }
    } catch (error) {
      console.error('Failed to load trade book:', error);
      setTradeBookError('Network error while loading trade book');
      setTradeBook(null);
    } finally {
      setLoadingTradeBook(false);
    }
  };

  const regenerateTokensForAccount = (accountId: string, accountName: string) => {
    setTokenRegenerationAccount({ id: accountId, name: accountName });
    setShowTokenRegeneration(true);
  };

  const confirmTokenRegeneration = async () => {
    if (!tokenRegenerationAccount || !totp.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please enter your TOTP code.',
      });
      return;
    }

    // Validate TOTP format (6 digits)
    if (!/^\d{6}$/.test(totp.trim())) {
      addNotification({
        type: 'error',
        title: 'Invalid TOTP',
        message: 'TOTP must be a 6-digit number.',
      });
      return;
    }

    setRegeneratingTokens(true);
    try {
      const account = accounts.find(acc => acc.id === tokenRegenerationAccount.id);
      if (!account) {
        throw new Error('Account not found');
      }

      // Validate account has required credentials
      if (!account.clientCode || !account.apiKey || !account.userPin) {
        addNotification({
          type: 'error',
          title: 'Missing Credentials',
          message: 'Account is missing required credentials (Client Code, API Key, or PIN).',
        });
        setRegeneratingTokens(false);
        return;
      }

      const response = await fetch('/api/auth/angel_one/generate/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: account.clientCode,
          client_pin: account.userPin,
          totp: totp.trim(),
          apiKey: account.apiKey,
          accountId: account.id,
        }),
      });

      if (response.ok) {
        console.log('✅ [Frontend] Token regeneration successful');
        setTotp(''); // Clear TOTP
        setShowTokenRegeneration(false);
        setTokenRegenerationAccount(null);

        addNotification({
          type: 'success',
          title: 'Tokens Regenerated',
          message: `Authentication tokens have been successfully regenerated for ${tokenRegenerationAccount.name}.`,
        });

        // Automatically reload the order book after successful token regeneration
        loadOrderBook(account);
        
        // Refresh the accounts list to show updated token status
        fetchAccounts();
      } else {
        const contentType = response.headers.get('content-type');
        console.error('❌ [Frontend] Token regeneration failed - initial response info:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          url: response.url,
          ok: response.ok
        });

        let errorData: { error?: string } = {};
        try {
          if (contentType && contentType.includes('application/json')) {
            const responseText = await response.text();
            console.error('❌ [Frontend] Raw response text:', responseText);
            errorData = JSON.parse(responseText);
            // Check if the response is empty or doesn't have expected fields
            if (!errorData || (typeof errorData === 'object' && Object.keys(errorData).length === 0)) {
              console.error('❌ [Frontend] Empty or invalid JSON response');
              errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
          } else {
            // Handle non-JSON responses (including text/plain)
            const textResponse = await response.text();
            console.error('❌ [Frontend] Non-JSON response received:', textResponse);
            errorData = { error: textResponse || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (jsonError) {
          console.error('❌ [Frontend] Failed to parse response:', jsonError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error('❌ [Frontend] Final error data:', errorData);

        addNotification({
          type: 'error',
          title: 'Token Regeneration Failed',
          message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      console.error('Token regeneration error:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to regenerate tokens. Please try again.',
      });
    } finally {
      setRegeneratingTokens(false);
    }
  };

  const refreshActiveTab = async () => {
    if (!selectedAccountId) return;

    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (!account) return;

    console.log('🔄 [Frontend] Refreshing active tab:', activeTab);

    switch (activeTab) {
      case 'signals':
        await loadSignals(selectedAccountId);
        break;
      case 'orderbook':
        await loadOrderBook(account);
        break;
      case 'tradebook':
        await loadTradeBook(account);
        break;
    }
  };

  const loadSignals = async (accountId: string) => {
    console.log('🎯 [Frontend] Loading signals for account:', accountId);
    setLoadingSignals(true);
    try {
      console.log('📤 [Frontend] Fetching signals from:', `/api/accounts/${accountId}/signals`);
      const response = await fetch(`/api/accounts/${accountId}/signals`);
      console.log('📥 [Frontend] Signals API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📥 [Frontend] Signals data received:', data.length, 'signals');
        console.log('📥 [Frontend] Sample signal:', data[0] || 'No signals');
        setAccountSignals(Array.isArray(data) ? data : data.data || []);
      } else {
        const errorData = await response.json();
        console.log('❌ [Frontend] Failed to load signals:', errorData);
        setAccountSignals([]);
      }
    } catch (error) {
      console.error('❌ [Frontend] Error loading signals:', error);
      setAccountSignals([]);
    } finally {
      setLoadingSignals(false);
    }
  };

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
        // Refresh account data
        fetchAccounts();
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
        title: 'Error',
        message: 'Failed to generate token.',
      });
    }
  };

  const updateProfile = async () => {
    // Validate required fields
    const errors: { name?: string } = {};
    
    if (!profile.name.trim()) {
      errors.name = 'Full Name is required';
    }
    
    setProfileErrors(errors);
    
    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      return;
    }

    const response = await fetch('/api/accounts/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (response.ok) {
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
      });
      fetchUserProfile();
      setProfileErrors({}); // Clear errors on success
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update profile.',
      });
    }
  };

  const addRestrictedSymbol = () => {
    if (newSymbol.trim() && !profile.restrictedSymbols.includes(newSymbol.trim())) {
      setProfile({
        ...profile,
        restrictedSymbols: [...profile.restrictedSymbols, newSymbol.trim()],
      });
      setNewSymbol('');
    }
  };

  const removeRestrictedSymbol = (symbol: string) => {
    setProfile({
      ...profile,
      restrictedSymbols: profile.restrictedSymbols.filter(s => s !== symbol),
    });
  };

  console.log('🎨 [Frontend] UserPage component rendering');
  console.log('🎨 [Frontend] Session status:', status);
  console.log('🎨 [Frontend] Accounts count:', accounts.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
                <p className="text-gray-600">Welcome back, {session.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{accounts.filter(acc => acc.isActive).length}</div>
                <div className="text-sm text-gray-500">Active Accounts</div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard</h3>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveSection('profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === 'profile'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile Settings</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('accounts')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === 'accounts'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium">Trading Accounts</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('details')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === 'details'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="font-medium">Token Generator</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('data');
                      // Auto-select first account if available and none selected
                      if (accounts.length > 0 && !selectedAccountId) {
                        const firstAccount = accounts[0];
                        setSelectedAccountId(firstAccount.id);
                        loadSignals(firstAccount.id);
                        loadOrderBook(firstAccount);
                        loadTradeBook(firstAccount);
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === 'data'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Account Data</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Profile Settings */}
            {activeSection === 'profile' && (
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
                      value={profile.name}
                      onChange={(e) => {
                        setProfile({ ...profile, name: e.target.value });
                        // Clear error when user starts typing
                        if (profileErrors.name) {
                          setProfileErrors({ ...profileErrors, name: undefined });
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
                      value={profile.primaryBroker}
                      onChange={(value) => setProfile({ ...profile, primaryBroker: value })}
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
                        checked={profile.isExecutionEnabled}
                        onChange={(e) => setProfile({ ...profile, isExecutionEnabled: e.target.checked })}
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
                    {profile.restrictedSymbols.map(symbol => (
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
                    onClick={updateProfile}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Trading Accounts */}
            {activeSection === 'accounts' && (
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
                              onClick={() => toggleActive(acc.id)}
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
            )}

            {/* Account Details */}
            {activeSection === 'details' && accounts.length > 0 && (
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
                        onChange={(e) => {
                          const accountId = e.target.value;
                          setSelectedAccountId(accountId);
                          if (accountId) {
                            const account = accounts.find(acc => acc.id === accountId);
                            if (account) {
                              loadSignals(accountId);
                              loadOrderBook(account);
                              loadTradeBook(account);
                            }
                          }
                        }}
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
            )}
            {activeSection === 'data' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Account Data</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Account:</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      const accountId = e.target.value;
                      setSelectedAccountId(accountId);
                      if (accountId) {
                        const account = accounts.find(acc => acc.id === accountId);
                        if (account) {
                          loadSignals(accountId);
                          loadOrderBook(account);
                          loadTradeBook(account);
                        }
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Tabs and Refresh Button */}
              <div className="flex justify-between items-center border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('signals')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'signals'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Signals Received
                  </button>
                  <button
                    onClick={() => setActiveTab('orderbook')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'orderbook'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Order Book
                  </button>
                  <button
                    onClick={() => setActiveTab('tradebook')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'tradebook'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Trade Book
                  </button>
                </nav>

                {/* Refresh Button */}
                <button
                  onClick={refreshActiveTab}
                  disabled={!selectedAccountId || loadingSignals || loadingOrderBook || loadingTradeBook}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {!selectedAccountId ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account</h3>
                    <p className="text-gray-500 mb-4">Choose a trading account from the dropdown above to view its data, signals, and trading history.</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'signals' && (
                      <div>
                        {loadingSignals ? (
                          <div className="text-center py-4">Loading signals...</div>
                        ) : accountSignals.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit Price</th>
                                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broadcast At</th>
                                  <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {accountSignals.map((signal, index) => (
                                  <tr key={signal.id || index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {signal.symbol || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {signal.action || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {signal.quantity || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {signal.limitPrice || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {signal.broadcastAt ? new Date(signal.broadcastAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {signal.status || 'Received'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-2.828a9 9 0 010-12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0111 5.172V18.828a1 1 0 01-1.707.707L5.586 15z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Signals Found</h3>
                            <p className="text-gray-500">This account doesn&apos;t have any signals yet.</p>
                            <p className="text-sm text-gray-400 mt-2">Signals will appear here when trading signals are broadcast.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'orderbook' && (
                      <div>
                        {loadingOrderBook ? (
                          <div className="text-center py-4">Loading order book...</div>
                        ) : orderBook !== null ? (
                          orderBook.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-4 py-2 border-b text-left">Order ID</th>
                                    <th className="px-4 py-2 border-b text-left">Symbol</th>
                                    <th className="px-4 py-2 border-b text-left">Side</th>
                                    <th className="px-4 py-2 border-b text-left">Quantity</th>
                                    <th className="px-4 py-2 border-b text-left">Price</th>
                                    <th className="px-4 py-2 border-b text-left">Status</th>
                                    <th className="px-4 py-2 border-b text-left">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderBook.map((order, index) => (
                                    <tr key={order.orderId || index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 border-b">{order.orderId}</td>
                                      <td className="px-4 py-2 border-b">{order.symbol}</td>
                                      <td className="px-4 py-2 border-b">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {order.side}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 border-b">{order.quantity}</td>
                                      <td className="px-4 py-2 border-b">{order.price && !isNaN(order.price) ? `₹${order.price.toFixed(2)}` : 'N/A'}</td>
                                      <td className="px-4 py-2 border-b">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          order.status === 'complete' ? 'bg-green-100 text-green-800' :
                                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 border-b text-gray-500">{order.orderDate || 'Not available'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-gray-400 mb-2">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
                              <p className="text-gray-500">This account doesn&apos;t have any orders yet.</p>
                              <p className="text-sm text-gray-400 mt-2">Orders will appear here once you place trades.</p>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-red-500 mb-2">Failed to load order book</div>
                            {orderBookError && (
                              <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                <strong>Error:</strong> {typeof orderBookError === 'string' ? orderBookError : orderBookError.message}
                                {typeof orderBookError === 'string' && orderBookError.includes('No authentication data found') && (
                                  <div className="mt-2 text-xs text-blue-600">
                                    💡 <strong>Tip:</strong> You need to generate an authentication token first. Go to the sidebar and enter your TOTP code, then click &quot;Generate Token&quot;.
                                  </div>
                                )}
                                {typeof orderBookError === 'object' && orderBookError.code === 'TOKEN_EXPIRED' && (
                                  <div className="mt-3 pt-3 border-t border-red-300">
                                    <div className="text-xs text-blue-600 mb-2">
                                      🔄 <strong>Action Required:</strong> Your authentication tokens have expired and need to be regenerated.
                                    </div>
                                    <button
                                      onClick={() => regenerateTokensForAccount(orderBookError.accountId!, orderBookError.accountName!)}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors font-medium"
                                    >
                                      🔑 Regenerate Tokens
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
                                  if (selectedAccount) {
                                    loadOrderBook(selectedAccount);
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'tradebook' && (
                      <div>
                        {loadingTradeBook ? (
                          <div className="text-center py-4">Loading trade book...</div>
                        ) : tradeBook ? (
                          tradeBook.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-4 py-2 border-b text-left">Trade ID</th>
                                    <th className="px-4 py-2 border-b text-left">Order ID</th>
                                    <th className="px-4 py-2 border-b text-left">Symbol</th>
                                    <th className="px-4 py-2 border-b text-left">Side</th>
                                    <th className="px-4 py-2 border-b text-left">Quantity</th>
                                    <th className="px-4 py-2 border-b text-left">Price</th>
                                    <th className="px-4 py-2 border-b text-left">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tradeBook.map((trade, index) => (
                                    <tr key={trade.tradeId || index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 border-b">{trade.tradeId}</td>
                                      <td className="px-4 py-2 border-b">{trade.orderId}</td>
                                      <td className="px-4 py-2 border-b">{trade.symbol}</td>
                                      <td className="px-4 py-2 border-b">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          trade.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {trade.side}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 border-b">{trade.quantity && trade.quantity > 0 ? trade.quantity : 'N/A'}</td>
                                      <td className="px-4 py-2 border-b">{trade.price && trade.price > 0 && !isNaN(trade.price) ? `₹${trade.price.toFixed(2)}` : 'N/A'}</td>
                                      <td className="px-4 py-2 border-b">{trade.tradeDate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-gray-400 mb-2">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-1">No Trades Found</h3>
                              <p className="text-gray-500">This account doesn&apos;t have any executed trades yet.</p>
                              <p className="text-sm text-gray-400 mt-2">Trades will appear here once orders are executed.</p>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-red-500 mb-2">Failed to load trade book</div>
                            {tradeBookError && (
                              <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                <strong>Error:</strong> {typeof tradeBookError === 'string' ? tradeBookError : tradeBookError.message}
                                {typeof tradeBookError === 'string' && tradeBookError.includes('No authentication data found') && (
                                  <div className="mt-2 text-xs text-blue-600">
                                    💡 <strong>Tip:</strong> You need to generate an authentication token first. Go to the sidebar and enter your TOTP code, then click &quot;Generate Token&quot;.
                                  </div>
                                )}
                                {typeof tradeBookError === 'object' && tradeBookError.code === 'TOKEN_EXPIRED' && (
                                  <div className="mt-3 pt-3 border-t border-red-300">
                                    <div className="text-xs text-blue-600 mb-2">
                                      🔄 <strong>Action Required:</strong> Your authentication tokens have expired and need to be regenerated.
                                    </div>
                                    <button
                                      onClick={() => regenerateTokensForAccount(tradeBookError.accountId!, tradeBookError.accountName!)}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors font-medium"
                                    >
                                      🔑 Regenerate Tokens
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
                                  if (selectedAccount) {
                                    loadTradeBook(selectedAccount);
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {pendingAction} this trading account?
                {pendingAction === 'deactivate' && (
                  <span className="block text-red-600 font-medium mt-2">
                    This will stop all automated trading for this account.
                  </span>
                )}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmToggleActive}
                  className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                    pendingAction === 'activate'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {pendingAction === 'activate' ? 'Activate' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Token Regeneration Dialog */}
        {showTokenRegeneration && tokenRegenerationAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Regenerate Authentication Tokens</h3>
              <p className="text-gray-600 mb-4">
                Your authentication tokens for <strong>{tokenRegenerationAccount.name}</strong> have expired.
                Please enter your TOTP code to regenerate them.
              </p>
              <div className="mb-4">
                <label htmlFor="totp-regeneration" className="block text-sm font-medium text-gray-700 mb-2">
                  TOTP Code
                </label>
                <input
                  id="totp-regeneration"
                  type="text"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="Enter 6-digit TOTP code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  disabled={regeneratingTokens}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowTokenRegeneration(false);
                    setTokenRegenerationAccount(null);
                    setTotp('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={regeneratingTokens}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTokenRegeneration}
                  disabled={regeneratingTokens || !totp.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {regeneratingTokens ? 'Regenerating...' : 'Regenerate Tokens'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

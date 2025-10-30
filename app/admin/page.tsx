'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '../../components/Header';
import SymbolSearch from '../../components/SymbolSearch';
import { useNotifications } from '../../lib/notifications';

interface Signal {
  id: string;
  symbol: string;
  quantity: number;
  action: 'BUY' | 'SELL';
  type: 'INTRADAY' | 'DELIVERY';
  orderType: 'MARKET' | 'LIMIT';
  limitPrice: number | null;
  broadcastAt: string;
  status: 'pending' | 'executed' | 'failed';
  adminEmail: string;
  ordersCount: number;
  successRate: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  accountsCount: number;
  signalsCount: number;
}

interface Account {
  id: string;
  name: string;
  broker: string;
  clientCode: string | null;
  userEmail: string;
  userName: string | null;
  isActive: boolean;
  tokenUpdatedAt: string;
  createdAt: string;
}

interface SystemStats {
  totalUsers: number;
  totalSignals: number;
  activeAccounts: number;
  totalOrders: number;
  recentSignals: number;
  userGrowth: number;
  averageOrdersPerSignal: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('broadcast');
  const { addNotification } = useNotifications();

  // Broadcast form state
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'INTRADAY' | 'DELIVERY'>('INTRADAY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [exchange, setExchange] = useState<'NSE' | 'BSE' | 'MCX' | 'NFO' | 'BFO'>('NSE');
  const [broadcasting, setBroadcasting] = useState(false);

  // Data states
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate human-readable time difference
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const tokenUpdatedAt = new Date(dateString);
    const timeDiff = now.getTime() - tokenUpdatedAt.getTime();

    // Calculate human-readable time
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    if (session?.user.role === 'admin') {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [signalsRes, usersRes, accountsRes, statsRes] = await Promise.all([
        fetch('/api/admin/signals'), // We'll create this
        fetch('/api/admin/users'),   // We'll create this
        fetch('/api/admin/accounts'), // New accounts API
        fetch('/api/admin/stats')    // We'll create this
      ]);

      if (signalsRes.ok) {
        const signals = await signalsRes.json();
        setRecentSignals(signals.slice(0, 10)); // Last 10 signals
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!symbol.trim()) {
      addNotification({
        type: 'warning',
        title: 'Missing Symbol',
        message: 'Please enter a trading symbol before broadcasting.',
      });
      return;
    }

    setBroadcasting(true);
    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: symbol.toUpperCase(), 
          quantity, 
          action, 
          type,
          orderType,
          limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          exchange
        }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Signal Broadcasted',
          message: `Successfully broadcasted ${action} signal for ${symbol.toUpperCase()} to all connected accounts.`,
        });
        setSymbol('');
        setQuantity(1);
        setAction('BUY');
        setType('INTRADAY');
        setOrderType('MARKET');
        setLimitPrice('');
        setExchange('NSE');
        fetchDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Broadcast Failed',
          message: error.error || 'Failed to broadcast signal. Please try again.',
        });
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to broadcast signal due to network error. Please check your connection.',
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'User Approved',
          message: 'User has been activated and can now access trading features.',
        });
        fetchDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Approval Failed',
          message: error.error || 'Failed to approve user.',
        });
      }
    } catch (error) {
      console.error('User approval error:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to approve user due to network error.',
      });
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'User Deactivated',
          message: 'User has been deactivated and can no longer access trading features.',
        });
        fetchDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Deactivation Failed',
          message: error.error || 'Failed to deactivate user.',
        });
      }
    } catch (error) {
      console.error('User deactivation error:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to deactivate user due to network error.',
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold">Access Denied</h2>
            <p>Admin privileges required to access this page.</p>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-800">Return to Home</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'broadcast', label: 'Broadcast Signal', icon: '📡' },
    { id: 'signals', label: 'Signal History', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    // Trading Accounts tab only for super admins
    ...(session?.user.role === 'super_admin' ? [{ id: 'accounts', label: 'Trading Accounts', icon: '🏦' }] : []),
    { id: 'stats', label: 'System Stats', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-3 sm:px-6 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Broadcast Trading Signal</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Exchange
                  </label>
                  <div className="flex space-2">
                    <button
                      type="button"
                      onClick={() => setExchange('NSE')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                        exchange === 'NSE'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏛️ NSE
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchange('BSE')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                        exchange === 'BSE'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🏢 BSE
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchange('MCX')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                        exchange === 'MCX'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📈 MCX
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchange('NFO')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                        exchange === 'NFO'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📊 NFO
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchange('BFO')}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                        exchange === 'BFO'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📈 BFO
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symbol
                    </label>
                    <SymbolSearch
                      onChange={setSymbol}
                      placeholder="Search for symbols (e.g., RELIANCE, TCS)"
                      className="w-full"
                      exchange={exchange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Action
                    </label>
                    <div className="flex space-3">
                      <button
                        type="button"
                        onClick={() => setAction('BUY')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                          action === 'BUY'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📈 Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction('SELL')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                          action === 'SELL'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📉 Sell
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Order Type
                    </label>
                    <div className="flex space-3">
                      <button
                        type="button"
                        onClick={() => setType('INTRADAY')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                          type === 'INTRADAY'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ⚡ Intraday
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('DELIVERY')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                          type === 'DELIVERY'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📅 Delivery
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Price Type
                    </label>
                    <div className="flex space-3">
                      <button
                        type="button"
                        onClick={() => setOrderType('MARKET')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                          orderType === 'MARKET'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        💰 Market
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('LIMIT')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                          orderType === 'LIMIT'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🎯 Limit
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limit Price
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      disabled={orderType === 'MARKET'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter limit price"
                    />
                  </div>
                </div>

                <button
                  onClick={handleBroadcast}
                  disabled={broadcasting || !symbol.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {broadcasting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Broadcasting...
                    </span>
                  ) : (
                    '📡 Broadcast Signal'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Signals</h2>
              <p className="text-sm text-gray-600">Last 10 broadcast signals and their status</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading signals...</div>
              ) : recentSignals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No signals broadcast yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentSignals.map((signal) => (
                        <tr key={signal.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{signal.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              signal.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {signal.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signal.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signal.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              signal.orderType === 'MARKET' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {signal.orderType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {signal.orderType === 'MARKET' ? 'Market' : `₹${signal.limitPrice?.toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signal.ordersCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signal.successRate.toFixed(1)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(signal.broadcastAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-600">Manage registered users and their roles</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounts</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.accountsCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.signalsCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            {session?.user.role === 'super_admin' && !user.isActive && (
                              <button
                                onClick={() => approveUser(user.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {session?.user.role === 'super_admin' && user.isActive && (
                              <button
                                onClick={() => deactivateUser(user.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && session?.user.role === 'super_admin' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Trading Accounts</h2>
              <p className="text-sm text-gray-600">All trading accounts with their status and token information</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No trading accounts found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Updated</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <tr key={account.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.broker}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.clientCode || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{account.userEmail}</div>
                              {account.userName && <div className="text-gray-500 text-xs">{account.userName}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div className="font-medium">{getTimeAgo(account.tokenUpdatedAt)}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(account.tokenUpdatedAt).toLocaleString()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Signals Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalSignals || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-purple-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeAccounts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-orange-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Signals (24h)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.recentSignals || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-indigo-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Users (30d)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.userGrowth || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-teal-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Orders/Signal</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.averageOrdersPerSignal || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
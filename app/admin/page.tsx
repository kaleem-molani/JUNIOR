'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '../../components/Header';
import SymbolSearch from '../../components/SymbolSearch';
import { useNotifications } from '../../lib/notifications';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

interface SystemOverview {
  totalUsers: number;
  totalActiveAccounts: number;
  totalExecutedSignals: number;
  orderStats: Record<string, number>;
  recentActivity: RecentActivity[];
}

interface RecentActivity {
  id: string;
  symbol: string;
  action: string;
  quantity: number;
  status: string;
  broadcastAt: string;
  admin: {
    email: string;
    name: string | null;
  };
  ordersCount: number;
}

interface TradingAccount {
  id: string;
  name: string;
  broker: string;
  clientCode: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsed: string | null;
  ordersCount: number;
  user: {
    email: string;
    name: string | null;
    isActive: boolean;
  };
}

interface SystemSignal {
  id: string;
  symbol: string;
  quantity: number;
  action: string;
  type: string;
  orderType: string;
  limitPrice: number | null;
  broadcastAt: string;
  status: string;
  ordersCount: number;
  admin: {
    email: string;
    name: string | null;
  };
  symbolData?: {
    symbol: string;
    name: string;
    exchange: string;
  };
}

interface SystemOrder {
  id: string;
  signalId: string;
  accountId: string;
  brokerOrderId: string | null;
  status: string;
  executedAt: string | null;
  errorMessage: string | null;
  signal: {
    symbol: string;
    action: string;
    quantity: number;
    broadcastAt: string;
  };
  account: {
    name: string;
    broker: string;
    user: {
      email: string;
      name: string | null;
    };
  };
}

interface TradebookEntry {
  id: string;
  tradeId: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number | null;
  orderType: string;
  tradeType: string;
  status: string;
  executedAt: string;
  signalTime: string;
  broker: string;
  accountName: string;
  user: {
    email: string;
    name: string | null;
    role: string;
  };
  errorMessage: string | null;
}

interface UserDetails {
  user: User & {
    name: string | null;
    isExecutionEnabled: boolean;
    primaryBroker: string | null;
    restrictedSymbols: string[];
    updatedAt: string;
  };
  tradingAccounts: TradingAccount[];
  signals: SystemSignal[];
  orders: SystemOrder[];
  logs: ActivityLog[];
  stats: {
    totalAccounts: number;
    activeAccounts: number;
    totalSignals: number;
    executedSignals: number;
    totalOrders: number;
    executedOrders: number;
    failedOrders: number;
    totalLogs: number;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
  level: string;
}

interface ApiRequestEntry {
  id: string;
  requestId: string;
  requestType: 'frontend_to_backend' | 'backend_to_broker';
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  statusCode: number | null;
  responseHeaders: Record<string, string> | null;
  responseBody: string | null;
  error: string | null;
  isSuccessful: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
}

interface ApiMonitoringStats {
  totalRequests: number;
  avgResponseTime: number | null;
  minResponseTime: number | null;
  maxResponseTime: number | null;
  requestTypeBreakdown: Record<string, { count: number; avgDuration: number | null }>;
}

interface ApiPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState(session?.user.role === 'super_admin' ? 'system-overview' : 'broadcast');
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

  // Superadmin monitoring states
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [allAccounts, setAllAccounts] = useState<TradingAccount[]>([]);
  const [allSignals, setAllSignals] = useState<SystemSignal[]>([]);
  const [allOrders, setAllOrders] = useState<SystemOrder[]>([]);
  const [tradebook, setTradebook] = useState<TradebookEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // API monitoring states
  const [apiRequests, setApiRequests] = useState<ApiRequestEntry[]>([]);
  const [apiMonitoringStats, setApiMonitoringStats] = useState<ApiMonitoringStats | null>(null);
  const [apiPagination, setApiPagination] = useState<ApiPagination | null>(null);
  const [apiFilters, setApiFilters] = useState({
    requestType: '',
    method: '',
    statusCode: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  });

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
    if (session?.user.role === 'admin' || session?.user.role === 'super_admin') {
      fetchDashboardData();
      fetchSuperadminData();
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

  // Superadmin data fetching functions
  const fetchSystemOverview = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?type=overview');
      if (response.ok) {
        const data = await response.json();
        setSystemOverview(data.overview);
      }
    } catch (error) {
      console.error('Failed to fetch system overview:', error);
    }
  };

  const fetchAllAccounts = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?type=accounts&limit=100');
      if (response.ok) {
        const data = await response.json();
        setAllAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch all accounts:', error);
    }
  };

  const fetchAllSignals = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?type=signals&limit=100');
      if (response.ok) {
        const data = await response.json();
        setAllSignals(data.signals);
      }
    } catch (error) {
      console.error('Failed to fetch all signals:', error);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?type=orders&limit=100');
      if (response.ok) {
        const data = await response.json();
        setAllOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
    }
  };

  const fetchTradebook = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?type=tradebook&limit=100');
      if (response.ok) {
        const data = await response.json();
        setTradebook(data.tradebook);
      }
    } catch (error) {
      console.error('Failed to fetch tradebook:', error);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
        setSelectedUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const fetchApiMonitoring = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(apiFilters).filter(([, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/monitoring/api-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setApiRequests(data.apiRequests);
        setApiMonitoringStats(data.statistics);
        setApiPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch API monitoring data:', error);
    }
  };

  const fetchSuperadminData = async () => {
    if (session?.user.role === 'super_admin') {
      await Promise.all([
        fetchSystemOverview(),
        fetchAllAccounts(),
        fetchAllSignals(),
        fetchAllOrders(),
        fetchTradebook(),
        fetchApiMonitoring()
      ]);
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

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
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
    // Broadcast Signal tab only for regular admins (not super admins)
    ...(session?.user.role === 'admin' ? [{ id: 'broadcast', label: 'Broadcast Signal', icon: '📡' }] : []),
    { id: 'signals', label: 'Signal History', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    // Trading Accounts tab only for super admins
    ...(session?.user.role === 'super_admin' ? [{ id: 'accounts', label: 'Trading Accounts', icon: '🏦' }] : []),
    { id: 'stats', label: 'System Stats', icon: '📈' },
    // Superadmin monitoring tabs
    ...(session?.user.role === 'super_admin' ? [
      { id: 'system-overview', label: 'System Overview', icon: '🌐' },
      { id: 'all-signals', label: 'All Signals', icon: '📡' },
      { id: 'all-orders', label: 'All Orders', icon: '📋' },
      { id: 'tradebook', label: 'Tradebook', icon: '📚' },
      { id: 'api-monitoring', label: 'API Monitoring', icon: '🔍' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-lg min-h-screen sticky top-16 z-20">
          <nav className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 px-2">Admin Panel</h2>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-full lg:max-w-none lg:ml-0 px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Superadmin System Overview Tab */}
        {activeTab === 'system-overview' && session?.user.role === 'super_admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
                <p className="text-sm text-gray-600">Complete system statistics and monitoring</p>
              </div>
              <div className="p-6">
                {systemOverview ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-500 rounded-full p-2">
                          <span className="text-white text-sm">👥</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{systemOverview.totalUsers}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-green-500 rounded-full p-2">
                          <span className="text-white text-sm">🏦</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Active Accounts</p>
                          <p className="text-2xl font-bold text-green-900">{systemOverview.totalActiveAccounts}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-purple-500 rounded-full p-2">
                          <span className="text-white text-sm">📡</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">Executed Signals</p>
                          <p className="text-2xl font-bold text-purple-900">{systemOverview.totalExecutedSignals}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-orange-500 rounded-full p-2">
                          <span className="text-white text-sm">📋</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-600">Total Orders</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {Object.values(systemOverview.orderStats).reduce((a: number, b: number) => a + b, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">Loading system overview...</div>
                )}
              </div>
            </div>

            {/* Database Performance Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { time: '00:00', connections: 5, active: 3 },
                    { time: '04:00', connections: 8, active: 5 },
                    { time: '08:00', connections: 15, active: 12 },
                    { time: '12:00', connections: 22, active: 18 },
                    { time: '16:00', connections: 18, active: 14 },
                    { time: '20:00', connections: 12, active: 9 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="connections" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Connections" />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Active Connections" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', avgResponse: 45, slowQueries: 2 },
                    { time: '04:00', avgResponse: 52, slowQueries: 1 },
                    { time: '08:00', avgResponse: 38, slowQueries: 0 },
                    { time: '12:00', avgResponse: 67, slowQueries: 3 },
                    { time: '16:00', avgResponse: 41, slowQueries: 1 },
                    { time: '20:00', avgResponse: 55, slowQueries: 2 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="avgResponse" stroke="#8884d8" name="Avg Response (ms)" />
                    <Line yAxisId="right" type="monotone" dataKey="slowQueries" stroke="#ff7300" name="Slow Queries (>1s)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity (24h)</h3>
              </div>
              <div className="p-6">
              {systemOverview ? (
                <div className="space-y-4">
                  {systemOverview.recentActivity && systemOverview.recentActivity.length > 0 ? (
                    systemOverview.recentActivity.map((activity: RecentActivity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <span className="text-blue-600">📡</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {activity.admin.name || activity.admin.email} broadcasted {activity.action} {activity.symbol}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.quantity} shares • {activity.ordersCount} orders • {getTimeAgo(activity.broadcastAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.status === 'executed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No recent activity</div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">Loading recent activity...</div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Superadmin All Signals Tab */}
        {activeTab === 'all-signals' && session?.user.role === 'super_admin' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Signals</h2>
              <p className="text-sm text-gray-600">Complete signal history across all users</p>
            </div>
            <div className="p-6">
              {allSignals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading signals...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allSignals.map((signal) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {signal.admin.name || signal.admin.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signal.ordersCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              signal.status === 'executed' ? 'bg-green-100 text-green-800' :
                              signal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {signal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTimeAgo(signal.broadcastAt)}
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

        {/* Superadmin All Orders Tab */}
        {activeTab === 'all-orders' && session?.user.role === 'super_admin' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Orders</h2>
              <p className="text-sm text-gray-600">Complete order history across all users and accounts</p>
            </div>
            <div className="p-6">
              {allOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading orders...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.signal.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.signal.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {order.signal.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.account.user.name || order.account.user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.account.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.account.broker}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'executed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.executedAt ? getTimeAgo(order.executedAt) : 'Pending'}
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

        {/* Superadmin Tradebook Tab */}
        {activeTab === 'tradebook' && session?.user.role === 'super_admin' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Tradebook</h2>
              <p className="text-sm text-gray-600">Complete trading history and performance analytics</p>
            </div>
            <div className="p-6">
              {tradebook.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading tradebook...</div>
              ) : (
                <div className="space-y-6">
                  {/* Trade Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{tradebook.length}</p>
                      <p className="text-sm text-blue-600">Total Trades</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {tradebook.filter(t => t.status === 'executed').length}
                      </p>
                      <p className="text-sm text-green-600">Successful</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {tradebook.filter(t => t.status === 'failed').length}
                      </p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {tradebook.filter(t => t.action === 'BUY').length}
                      </p>
                      <p className="text-sm text-purple-600">Buy Orders</p>
                    </div>
                  </div>

                  {/* Trade Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tradebook.map((trade) => (
                          <tr key={trade.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.symbol}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                trade.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {trade.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {trade.user.name || trade.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.accountName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {trade.price ? `₹${trade.price}` : 'Market'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                trade.status === 'executed' ? 'bg-green-100 text-green-800' :
                                trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {trade.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {trade.executedAt ? getTimeAgo(trade.executedAt) : 'Pending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Superadmin API Monitoring Tab */}
        {activeTab === 'api-monitoring' && session?.user.role === 'super_admin' && (
          <div className="space-y-6">
            {/* API Performance Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Request Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { time: '00:00', frontend: 45, backend: 12 },
                    { time: '04:00', frontend: 52, backend: 8 },
                    { time: '08:00', frontend: 78, backend: 25 },
                    { time: '12:00', frontend: 95, backend: 35 },
                    { time: '16:00', frontend: 87, backend: 28 },
                    { time: '20:00', frontend: 65, backend: 18 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="frontend" stackId="a" fill="#8884d8" name="Frontend→Backend" />
                    <Bar dataKey="backend" stackId="a" fill="#82ca9d" name="Backend→Broker" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', avgTime: 145, p95Time: 320 },
                    { time: '04:00', avgTime: 152, p95Time: 280 },
                    { time: '08:00', avgTime: 138, p95Time: 450 },
                    { time: '12:00', avgTime: 167, p95Time: 520 },
                    { time: '16:00', avgTime: 141, p95Time: 380 },
                    { time: '20:00', avgTime: 155, p95Time: 410 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgTime" stroke="#8884d8" name="Average Response Time (ms)" />
                    <Line type="monotone" dataKey="p95Time" stroke="#ff7300" name="95th Percentile (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '2xx Success', value: 85, fill: '#00C49F' },
                        { name: '4xx Client Error', value: 12, fill: '#FFBB28' },
                        { name: '5xx Server Error', value: 3, fill: '#FF8042' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Rate Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { time: '00:00', errorRate: 2.1 },
                    { time: '04:00', errorRate: 1.8 },
                    { time: '08:00', errorRate: 3.2 },
                    { time: '12:00', errorRate: 4.5 },
                    { time: '16:00', errorRate: 2.8 },
                    { time: '20:00', errorRate: 1.9 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="errorRate" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} name="Error Rate (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">API Monitoring</h2>
                <p className="text-sm text-gray-600">Monitor all API requests and responses across the system</p>
              </div>
              <div className="p-6">
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={apiFilters.requestType}
                    onChange={(e) => setApiFilters(prev => ({ ...prev, requestType: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Request Types</option>
                    <option value="frontend_to_backend">Frontend → Backend</option>
                    <option value="backend_to_broker">Backend → Broker</option>
                  </select>

                  <select
                    value={apiFilters.method}
                    onChange={(e) => setApiFilters(prev => ({ ...prev, method: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Status Code"
                    value={apiFilters.statusCode}
                    onChange={(e) => setApiFilters(prev => ({ ...prev, statusCode: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="text"
                    placeholder="Search URL/Body"
                    value={apiFilters.search}
                    onChange={(e) => setApiFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => fetchApiMonitoring(1)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>

                  {apiMonitoringStats && (
                    <div className="text-sm text-gray-600">
                      Total Requests: {apiMonitoringStats.totalRequests} |
                      Avg Response Time: {apiMonitoringStats.avgResponseTime ? `${apiMonitoringStats.avgResponseTime}ms` : 'N/A'}
                    </div>
                  )}
                </div>

                {/* API Requests Table */}
                {apiRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Loading API requests...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {apiRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                request.requestType === 'frontend_to_backend'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {request.requestType === 'frontend_to_backend' ? 'FE→BE' : 'BE→BR'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                request.method === 'GET' ? 'bg-green-100 text-green-800' :
                                request.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {request.method}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={request.url}>
                              {request.url.length > 50 ? `${request.url.substring(0, 50)}...` : request.url}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.user ? (request.user.name || request.user.email) : 'Anonymous'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                request.statusCode && request.statusCode >= 200 && request.statusCode < 300
                                  ? 'bg-green-100 text-green-800'
                                  : request.statusCode && request.statusCode >= 400
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {request.statusCode || 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.duration ? `${request.duration}ms` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getTimeAgo(request.startedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {apiPagination && apiPagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Page {apiPagination.page} of {apiPagination.totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchApiMonitoring(apiPagination.page - 1)}
                        disabled={!apiPagination.hasPrev}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchApiMonitoring(apiPagination.page + 1)}
                        disabled={!apiPagination.hasNext}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        </main>
      </div>
    </div>
  );
}
// app/monitoring/page.tsx
// Monitoring Dashboard for JUNIOR Trading Application

'use client'

import { useState, useEffect } from 'react'

interface DatabaseMetrics {
  connection: boolean
  info: {
    connected: boolean
    version?: string
    error?: string
  }
  pool: {
    activeConnections?: number
    error?: string
  }
  tables: Array<{
    tablename: string
    live_rows: number
    dead_rows: number
    inserts: number
  }>
}

interface BroadcastMetrics {
  totalSignals: number
  totalOrders: number
  avgOrdersPerSignal: number
  executionMetrics: {
    averageExecutionTime: number
    maxExecutionTime: number
    minExecutionTime: number
    targetTime: number
    successRate: number
  }
  recentActivity: Array<{
    id: string
    symbol: string
    action: string
    quantity: number
    orderCount: number
    broadcastAt: string
  }>
}

interface SystemMetrics {
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  uptime: number
  nodeVersion: string
  platform: string
  environment: {
    NODE_ENV?: string
    APP_ENV?: string
    SANDBOX_MODE?: string
  }
}

interface MonitoringData {
  database: DatabaseMetrics
  broadcast: BroadcastMetrics
  system: SystemMetrics
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'broadcast' | 'system'>('overview')

  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring')
      if (!response.ok) throw new Error('Failed to fetch monitoring data')
      const result = await response.json()
      setData(result.metrics)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Monitoring Dashboard</h1>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Monitoring Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading monitoring data: {error}</p>
            <button
              onClick={fetchMonitoringData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
          <button
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white p-1 rounded-lg shadow">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'database' as const, label: 'Database' },
              { id: 'broadcast' as const, label: 'Broadcast' },
              { id: 'system' as const, label: 'System' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && data && <OverviewTab data={data} />}
        {activeTab === 'database' && data && <DatabaseTab data={data.database} />}
        {activeTab === 'broadcast' && data && <BroadcastTab data={data.broadcast} />}
        {activeTab === 'system' && data && <SystemTab data={data.system} />}
      </div>
    </div>
  )
}

function OverviewTab({ data }: { data: MonitoringData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Database Health */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${data.database.connection ? 'text-green-600' : 'text-red-600'}`}>
              {data.database.connection ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Connections:</span>
            <span className="font-medium">{data.database.pool.activeConnections || 0}</span>
          </div>
        </div>
      </div>

      {/* Broadcast Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Broadcast</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Signals:</span>
            <span className="font-medium">{data.broadcast.totalSignals}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Execution:</span>
            <span className="font-medium">{data.broadcast.executionMetrics.averageExecutionTime}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Success Rate:</span>
            <span className="font-medium text-green-600">{data.broadcast.executionMetrics.successRate}%</span>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Uptime:</span>
            <span className="font-medium">{Math.floor(data.system.uptime / 3600)}h {Math.floor((data.system.uptime % 3600) / 60)}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Memory Used:</span>
            <span className="font-medium">{Math.round(data.system.memory.heapUsed / 1024 / 1024)}MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Environment:</span>
            <span className="font-medium">{data.system.environment.APP_ENV || 'production'}</span>
          </div>
        </div>
      </div>

      {/* Performance Targets */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Targets</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Target Time:</span>
            <span className="font-medium">{data.broadcast.executionMetrics.targetTime}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current Avg:</span>
            <span className={`font-medium ${data.broadcast.executionMetrics.averageExecutionTime <= data.broadcast.executionMetrics.targetTime ? 'text-green-600' : 'text-red-600'}`}>
              {data.broadcast.executionMetrics.averageExecutionTime}s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${data.broadcast.executionMetrics.averageExecutionTime <= data.broadcast.executionMetrics.targetTime ? 'text-green-600' : 'text-red-600'}`}>
              {data.broadcast.executionMetrics.averageExecutionTime <= data.broadcast.executionMetrics.targetTime ? '✓ On Target' : '⚠ Over Target'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DatabaseTab({ data }: { data: DatabaseMetrics }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Database Connection:</span>
            <span className={`ml-2 font-medium ${data.connection ? 'text-green-600' : 'text-red-600'}`}>
              {data.connection ? '✓ Connected' : '✗ Disconnected'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Active Connections:</span>
            <span className="ml-2 font-medium">{data.pool.activeConnections || 'N/A'}</span>
          </div>
        </div>
        {data.info.version && (
          <div className="mt-4">
            <span className="text-gray-600">PostgreSQL Version:</span>
            <span className="ml-2 font-medium">{data.info.version}</span>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Live Rows</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dead Rows</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inserts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tables.map((table, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{table.tablename}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{table.live_rows}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{table.dead_rows}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{table.inserts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BroadcastTab({ data }: { data: BroadcastMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Signal Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Signals:</span>
              <span className="font-medium">{data.totalSignals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Orders:</span>
              <span className="font-medium">{data.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Orders/Signal:</span>
              <span className="font-medium">{data.avgOrdersPerSignal.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Time:</span>
              <span className="font-medium">{data.executionMetrics.averageExecutionTime}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Time:</span>
              <span className="font-medium">{data.executionMetrics.maxExecutionTime}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Min Time:</span>
              <span className="font-medium">{data.executionMetrics.minExecutionTime}s</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-medium text-green-600">{data.executionMetrics.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Target Time:</span>
              <span className="font-medium">{data.executionMetrics.targetTime}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${data.executionMetrics.averageExecutionTime <= data.executionMetrics.targetTime ? 'text-green-600' : 'text-red-600'}`}>
                {data.executionMetrics.averageExecutionTime <= data.executionMetrics.targetTime ? 'On Target' : 'Over Target'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Broadcast Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{activity.symbol}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{activity.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{activity.orderCount}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(activity.broadcastAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SystemTab({ data }: { data: SystemMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Node.js Version:</span>
              <span className="font-medium">{data.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="font-medium">{data.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium">{Math.floor(data.uptime / 3600)}h {Math.floor((data.uptime % 3600) / 60)}m</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">NODE_ENV:</span>
              <span className="font-medium">{data.environment.NODE_ENV || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">APP_ENV:</span>
              <span className="font-medium">{data.environment.APP_ENV || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SANDBOX_MODE:</span>
              <span className="font-medium">{data.environment.SANDBOX_MODE || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(data.memory.heapUsed / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-gray-600">Heap Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(data.memory.heapTotal / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-gray-600">Heap Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(data.memory.rss / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-gray-600">RSS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(data.memory.external / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-gray-600">External</div>
          </div>
        </div>
      </div>
    </div>
  )
}
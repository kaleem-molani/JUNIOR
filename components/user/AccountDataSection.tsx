import { TradingAccount, OrderBookEntry, TradeBookEntry, UserSignal } from '@/lib/types';

interface AccountDataSectionProps {
  accounts: TradingAccount[];
  activeTab: 'signals' | 'orderbook' | 'tradebook';
  selectedAccountId: string;
  accountSignals: UserSignal[];
  orderBook: OrderBookEntry[] | null;
  orderBookError: string | { message: string; code?: string; accountId?: string; accountName?: string } | null;
  tradeBook: TradeBookEntry[] | null;
  tradeBookError: string | { message: string; code?: string; accountId?: string; accountName?: string } | null;
  loadingSignals: boolean;
  loadingOrderBook: boolean;
  loadingTradeBook: boolean;
  onActiveTabChange: (tab: 'signals' | 'orderbook' | 'tradebook') => void;
  onSelectedAccountIdChange: (accountId: string) => void;
  onLoadSignals: (accountId: string) => void;
  onLoadOrderBook: (account: TradingAccount) => void;
  onLoadTradeBook: (account: TradingAccount) => void;
  onRefreshActiveTab: () => void;
  onRegenerateTokens: (accountId: string, accountName: string) => void;
}

export default function AccountDataSection({
  accounts,
  activeTab,
  selectedAccountId,
  accountSignals,
  orderBook,
  orderBookError,
  tradeBook,
  tradeBookError,
  loadingSignals,
  loadingOrderBook,
  loadingTradeBook,
  onActiveTabChange,
  onSelectedAccountIdChange,
  onLoadSignals,
  onLoadOrderBook,
  onLoadTradeBook,
  onRefreshActiveTab,
  onRegenerateTokens,
}: AccountDataSectionProps) {
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
              onChange={(e) => handleAccountChange(e.target.value)}
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
              onClick={() => onActiveTabChange('signals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'signals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Signals Received
            </button>
            <button
              onClick={() => onActiveTabChange('orderbook')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orderbook'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order Book
            </button>
            <button
              onClick={() => onActiveTabChange('tradebook')}
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
            onClick={onRefreshActiveTab}
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
                  ) : orderBookError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error Loading Order Book</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{typeof orderBookError === 'string' ? orderBookError : orderBookError.message}</p>
                            {typeof orderBookError === 'object' && orderBookError.code && (
                              <p className="mt-1">Error Code: {orderBookError.code}</p>
                            )}
                          </div>
                          {typeof orderBookError === 'object' && orderBookError.accountId && (
                            <div className="mt-3">
                              <button
                                onClick={() => onRegenerateTokens(orderBookError.accountId!, orderBookError.accountName!)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium"
                              >
                                Regenerate Tokens
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : orderBook && orderBook.length > 0 ? (
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
                              <td className="px-4 py-2 border-b">{order.side}</td>
                              <td className="px-4 py-2 border-b">{order.quantity}</td>
                              <td className="px-4 py-2 border-b">{order.price}</td>
                              <td className="px-4 py-2 border-b">{order.status}</td>
                              <td className="px-4 py-2 border-b">{order.orderDate}</td>
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
                      <p className="text-gray-500">This account doesn&apos;t have any orders in the order book.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tradebook' && (
                <div>
                  {loadingTradeBook ? (
                    <div className="text-center py-4">Loading trade book...</div>
                  ) : tradeBookError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error Loading Trade Book</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{typeof tradeBookError === 'string' ? tradeBookError : tradeBookError.message}</p>
                            {typeof tradeBookError === 'object' && tradeBookError.code && (
                              <p className="mt-1">Error Code: {tradeBookError.code}</p>
                            )}
                          </div>
                          {typeof tradeBookError === 'object' && tradeBookError.accountId && (
                            <div className="mt-3">
                              <button
                                onClick={() => onRegenerateTokens(tradeBookError.accountId!, tradeBookError.accountName!)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium"
                              >
                                Regenerate Tokens
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : tradeBook && tradeBook.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 border-b text-left">Trade ID</th>
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
                              <td className="px-4 py-2 border-b">{trade.symbol}</td>
                              <td className="px-4 py-2 border-b">{trade.side}</td>
                              <td className="px-4 py-2 border-b">{trade.quantity}</td>
                              <td className="px-4 py-2 border-b">{trade.price}</td>
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
                      <p className="text-gray-500">This account doesn&apos;t have any completed trades in the trade book.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
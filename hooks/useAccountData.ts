import { useState, useCallback } from 'react';
import { TradingAccount, OrderBookEntry, TradeBookEntry, UserSignal } from '@/lib/types';

export function useAccountData() {
  const [activeTab, setActiveTab] = useState<'signals' | 'orderbook' | 'tradebook'>('signals');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Signals state
  const [accountSignals, setAccountSignals] = useState<UserSignal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(false);

  // Order book state
  const [orderBook, setOrderBook] = useState<OrderBookEntry[] | null>(null);
  const [orderBookError, setOrderBookError] = useState<string | { message: string; code?: string; accountId?: string; accountName?: string } | null>(null);
  const [loadingOrderBook, setLoadingOrderBook] = useState(false);

  // Trade book state
  const [tradeBook, setTradeBook] = useState<TradeBookEntry[] | null>(null);
  const [tradeBookError, setTradeBookError] = useState<string | { message: string; code?: string; accountId?: string; accountName?: string } | null>(null);
  const [loadingTradeBook, setLoadingTradeBook] = useState(false);

  const loadSignals = useCallback(async (accountId: string) => {
    setLoadingSignals(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/signals`);
      if (response.ok) {
        const signals = await response.json();
        setAccountSignals(signals);
      } else {
        console.error('Failed to load signals');
        setAccountSignals([]);
      }
    } catch (error) {
      console.error('Error loading signals:', error);
      setAccountSignals([]);
    } finally {
      setLoadingSignals(false);
    }
  }, []);

  const loadOrderBook = useCallback(async (account: TradingAccount) => {
    setLoadingOrderBook(true);
    setOrderBookError(null);
    try {
      const response = await fetch(`/api/accounts/${account.id}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrderBook(data);
      } else {
        const errorData = await response.json();
        setOrderBookError({
          message: errorData.error || 'Failed to load order book',
          code: errorData.code,
          accountId: account.id,
          accountName: account.name,
        });
        setOrderBook(null);
      }
    } catch (error) {
      console.error('Error loading order book:', error);
      setOrderBookError({
        message: 'Network error occurred',
        accountId: account.id,
        accountName: account.name,
      });
      setOrderBook(null);
    } finally {
      setLoadingOrderBook(false);
    }
  }, []);

  const loadTradeBook = useCallback(async (account: TradingAccount) => {
    setLoadingTradeBook(true);
    setTradeBookError(null);
    try {
      const response = await fetch(`/api/accounts/${account.id}/orders?type=tradebook`);
      if (response.ok) {
        const data = await response.json();
        setTradeBook(data);
      } else {
        const errorData = await response.json();
        setTradeBookError({
          message: errorData.error || 'Failed to load trade book',
          code: errorData.code,
          accountId: account.id,
          accountName: account.name,
        });
        setTradeBook(null);
      }
    } catch (error) {
      console.error('Error loading trade book:', error);
      setTradeBookError({
        message: 'Network error occurred',
        accountId: account.id,
        accountName: account.name,
      });
      setTradeBook(null);
    } finally {
      setLoadingTradeBook(false);
    }
  }, []);

  const refreshActiveTab = useCallback(async () => {
    if (!selectedAccountId) return;

    const account = { id: selectedAccountId, name: 'Selected Account' } as TradingAccount;

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
  }, [selectedAccountId, activeTab, loadSignals, loadOrderBook, loadTradeBook]);

  return {
    // Tab state
    activeTab,
    setActiveTab,
    selectedAccountId,
    setSelectedAccountId,

    // Signals
    accountSignals,
    loadingSignals,
    loadSignals,

    // Order book
    orderBook,
    orderBookError,
    loadingOrderBook,
    loadOrderBook,

    // Trade book
    tradeBook,
    tradeBookError,
    loadingTradeBook,
    loadTradeBook,

    // Utilities
    refreshActiveTab,
  };
}
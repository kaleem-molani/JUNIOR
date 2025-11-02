import { useState, useCallback } from 'react';
import { TradingAccount } from '@/lib/types';

export interface NewAccountData {
  broker: string;
  clientCode: string;
  apiKey: string;
  userPin: string;
  name: string;
}

export function useTradingAccounts() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    console.log('📥 [Frontend] Fetching accounts from /api/accounts');
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = async (accountData: NewAccountData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (response.ok) {
        await fetchAccounts(); // Refresh accounts list
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error };
      }
    } catch (error) {
      console.error('Error creating account:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountActive = async (accountId: string, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        await fetchAccounts(); // Refresh accounts list
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error };
      }
    } catch (error) {
      console.error('Error toggling account active status:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAccounts(); // Refresh accounts list
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error };
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts,
    loading,
    fetchAccounts,
    createAccount,
    toggleAccountActive,
    deleteAccount,
  };
}
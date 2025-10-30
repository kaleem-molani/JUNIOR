'use client';

import { useState, useEffect, useRef } from 'react';

interface Symbol {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  lastUpdated: Date;
}

interface SymbolSearchProps {
  onChange: (symbol: string) => void;
  placeholder?: string;
  className?: string;
  exchange?: string;
}

export default function SymbolSearch({
  onChange,
  placeholder = "Search for symbols...",
  className = "",
  exchange = "NSE"
}: SymbolSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchSymbols(query, exchange);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, exchange]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSymbols = async (searchQuery: string, searchExchange: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/symbols/search?q=${encodeURIComponent(searchQuery)}&exchange=${searchExchange}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
        setShowResults(true);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSymbol = (symbol: Symbol) => {
    onChange(symbol.symbol);
    setQuery(symbol.symbol);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectSymbol(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="flex gap-2">
        {/* Symbol Search Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((symbol, index) => (
            <button
              key={symbol.id}
              onClick={() => handleSelectSymbol(symbol)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{symbol.symbol}</div>
                  <div className="text-sm text-gray-600 truncate">{symbol.name}</div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {symbol.exchange}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
          No symbols found for &quot;{query}&quot; on {exchange}
        </div>
      )}
    </div>
  );
}
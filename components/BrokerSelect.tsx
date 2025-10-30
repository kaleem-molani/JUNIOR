import React from 'react';

interface BrokerOption {
  value: string;
  label: string;
  supported: boolean;
}

const BROKER_OPTIONS: BrokerOption[] = [
  { value: 'angelone', label: 'Angel One', supported: true },
  { value: 'zerodha', label: 'Zerodha', supported: false },
  { value: '5paisa', label: '5Paisa', supported: false },
];

interface BrokerSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  showUnsupported?: boolean;
}

export default function BrokerSelect({
  value,
  onChange,
  className = '',
  placeholder = 'Select Broker',
  showUnsupported = true
}: BrokerSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const option = BROKER_OPTIONS.find(opt => opt.value === selectedValue);

    // Only allow selection of supported brokers
    if (option?.supported) {
      onChange(selectedValue);
    }
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
    >
      <option value="">{placeholder}</option>
      {BROKER_OPTIONS.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={!option.supported && !showUnsupported}
          className={!option.supported ? 'text-gray-400' : ''}
        >
          {option.label}
          {!option.supported && showUnsupported && ' (Coming Soon)'}
        </option>
      ))}
    </select>
  );
}
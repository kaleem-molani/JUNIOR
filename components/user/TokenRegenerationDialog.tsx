interface TokenRegenerationDialogProps {
  isOpen: boolean;
  account: { id: string; name: string } | null;
  totp: string;
  isRegenerating?: boolean;
  onTotpChange: (totp: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function TokenRegenerationDialog({
  isOpen,
  account,
  totp,
  isRegenerating = false,
  onTotpChange,
  onCancel,
  onConfirm,
}: TokenRegenerationDialogProps) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Regenerate Authentication Tokens</h3>
        <p className="text-gray-600 mb-4">
          Your authentication tokens for <strong>{account.name}</strong> have expired.
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
            onChange={(e) => onTotpChange(e.target.value)}
            placeholder="Enter 6-digit TOTP code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
            disabled={isRegenerating}
          />
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isRegenerating}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRegenerating || !totp.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Tokens'}
          </button>
        </div>
      </div>
    </div>
  );
}
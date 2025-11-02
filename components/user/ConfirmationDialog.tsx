interface ConfirmationDialogProps {
  isOpen: boolean;
  action: 'activate' | 'deactivate' | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  action,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to {action} this trading account?
          {action === 'deactivate' && (
            <span className="block text-red-600 font-medium mt-2">
              This will stop all automated trading for this account.
            </span>
          )}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
              action === 'activate'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {action === 'activate' ? 'Activate' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import Icon from './Icon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  confirmButtonText: string;
  requireNameTyping?: boolean;
  expectedName?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmButtonText,
  requireNameTyping = false,
  expectedName = '',
  isDestructive = false,
  isLoading = false
}) => {
  const [typedName, setTypedName] = useState('');

  const canConfirm = requireNameTyping ? typedName === expectedName : true;

  const handleClose = () => {
    setTypedName('');
    onClose();
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      setTypedName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-600 mb-4">{description}</p>
          
          {requireNameTyping && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {confirmText}
              </p>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={expectedName}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {typedName && typedName !== expectedName && (
                <p className="text-sm text-red-600 mt-1">
                  Name does not match. Please type "{expectedName}" exactly.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
            } disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
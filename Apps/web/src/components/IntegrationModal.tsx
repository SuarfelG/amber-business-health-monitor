import React, { useState } from 'react';
import { apiClient } from '../api';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState<'stripe' | 'ghl' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStripeConnect = async () => {
    try {
      setLoading('stripe');
      setError(null);
      const result = await apiClient.getStripeOAuthUrl();
      if (result.error) {
        setError(`Stripe: ${result.error}`);
        setLoading(null);
      } else if (result.data?.oauthUrl) {
        window.location.href = result.data.oauthUrl;
      }
    } catch (err) {
      setError('Failed to initiate Stripe connection. Please try again.');
      setLoading(null);
    }
  };

  const handleGHLConnect = async () => {
    try {
      setLoading('ghl');
      setError(null);
      const result = await apiClient.getGHLOAuthUrl();
      if (result.error) {
        setError(`GoHighLevel: ${result.error}`);
        setLoading(null);
      } else if (result.data?.oauthUrl) {
        window.location.href = result.data.oauthUrl;
      }
    } catch (err) {
      setError('Failed to initiate GoHighLevel connection. Please try again.');
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-light dark:text-white">
            Connect Your Integrations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Link Stripe for payments and GoHighLevel for CRM data
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={handleStripeConnect}
            disabled={loading !== null}
            className="w-full py-3 rounded-lg font-medium transition text-left px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <span>{loading === 'stripe' ? 'Connecting...' : 'Connect Stripe'}</span>
              <span className="text-lg">💳</span>
            </div>
          </button>

          <button
            onClick={handleGHLConnect}
            disabled={loading !== null}
            className="w-full py-3 rounded-lg font-medium transition text-left px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <span>{loading === 'ghl' ? 'Connecting...' : 'Connect GoHighLevel'}</span>
              <span className="text-lg">🚀</span>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg font-medium transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

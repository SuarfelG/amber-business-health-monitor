import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState<'stripe' | 'ghl' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [ghlStatus, setGHLStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<'stripe' | 'ghl' | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  const fetchStatuses = async () => {
    try {
      setStatusLoading(true);
      const [stripeResult, ghlResult] = await Promise.all([
        apiClient.getStripeStatus(),
        apiClient.getGHLStatus(),
      ]);
      if (stripeResult.data) {
        setStripeStatus(stripeResult.data as any);
      }
      if (ghlResult.data) {
        setGHLStatus(ghlResult.data as any);
      }
    } catch (err) {
      console.error('Failed to fetch integration status', err);
    } finally {
      setStatusLoading(false);
    }
  };

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

  const handleStripeDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Stripe? You can reconnect anytime.')) {
      return;
    }
    try {
      setDisconnecting('stripe');
      setError(null);
      const result = await apiClient.disconnectStripe();
      if (result.error) {
        setError(`Failed to disconnect Stripe: ${result.error}`);
      } else {
        await fetchStatuses();
      }
    } catch (err) {
      setError('Failed to disconnect Stripe. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  };

  const handleGHLDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect GoHighLevel? You can reconnect anytime.')) {
      return;
    }
    try {
      setDisconnecting('ghl');
      setError(null);
      const result = await apiClient.disconnectGHL();
      if (result.error) {
        setError(`Failed to disconnect GoHighLevel: ${result.error}`);
      } else {
        await fetchStatuses();
      }
    } catch (err) {
      setError('Failed to disconnect GoHighLevel. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  };

  if (!isOpen) return null;

  const isStripeConnected = stripeStatus?.status === 'CONNECTED';
  const isGhlConnected = ghlStatus?.status === 'CONNECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 border transition-colors ${
        isDark
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Connect Your Integrations
          </h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Link Stripe for payments and GoHighLevel for CRM data
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-3 rounded-lg border ${
            isDark
              ? 'bg-red-500/20 border-red-500/30'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        {statusLoading ? (
          <p className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Loading status...
          </p>
        ) : (
          <div className="space-y-3 mb-6">
            {isStripeConnected ? (
              <div className={`py-4 px-4 rounded-lg border space-y-3 ${
                isDark
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    Connected ✓
                  </span>
                </div>
                {stripeStatus?.lastSyncAt && (
                  <p className={`text-xs ${isDark ? 'text-green-300/70' : 'text-green-600/70'}`}>
                    Last sync: {new Date(stripeStatus.lastSyncAt).toLocaleDateString()} at {new Date(stripeStatus.lastSyncAt).toLocaleTimeString()}
                  </p>
                )}
                {stripeStatus?.lastSyncError && (
                  <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Last sync error: {stripeStatus.lastSyncError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleStripeConnect}
                    disabled={loading === 'stripe' || disconnecting !== null}
                    className={`text-xs font-medium px-3 py-1 rounded transition ${
                      isDark
                        ? 'bg-blue-700 text-blue-300 hover:bg-blue-600'
                        : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                    } disabled:opacity-50`}
                  >
                    {loading === 'stripe' ? 'Reconnecting...' : 'Reconnect'}
                  </button>
                  <button
                    onClick={handleStripeDisconnect}
                    disabled={disconnecting === 'stripe' || loading !== null}
                    className={`text-xs font-medium px-3 py-1 rounded transition ${
                      isDark
                        ? 'bg-red-700 text-red-300 hover:bg-red-600'
                        : 'bg-red-200 text-red-700 hover:bg-red-300'
                    } disabled:opacity-50`}
                  >
                    {disconnecting === 'stripe' ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
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
            )}

            {isGhlConnected ? (
              <div className={`py-4 px-4 rounded-lg border space-y-3 ${
                isDark
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    Connected ✓
                  </span>
                </div>
                {ghlStatus?.lastSyncAt && (
                  <p className={`text-xs ${isDark ? 'text-green-300/70' : 'text-green-600/70'}`}>
                    Last sync: {new Date(ghlStatus.lastSyncAt).toLocaleDateString()} at {new Date(ghlStatus.lastSyncAt).toLocaleTimeString()}
                  </p>
                )}
                {ghlStatus?.lastSyncError && (
                  <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Last sync error: {ghlStatus.lastSyncError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleGHLConnect}
                    disabled={loading === 'ghl' || disconnecting !== null}
                    className={`text-xs font-medium px-3 py-1 rounded transition ${
                      isDark
                        ? 'bg-purple-700 text-purple-300 hover:bg-purple-600'
                        : 'bg-purple-200 text-purple-700 hover:bg-purple-300'
                    } disabled:opacity-50`}
                  >
                    {loading === 'ghl' ? 'Reconnecting...' : 'Reconnect'}
                  </button>
                  <button
                    onClick={handleGHLDisconnect}
                    disabled={disconnecting === 'ghl' || loading !== null}
                    className={`text-xs font-medium px-3 py-1 rounded transition ${
                      isDark
                        ? 'bg-red-700 text-red-300 hover:bg-red-600'
                        : 'bg-red-200 text-red-700 hover:bg-red-300'
                    } disabled:opacity-50`}
                  >
                    {disconnecting === 'ghl' ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className={`w-full py-2 rounded-lg font-medium transition ${
            isDark
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

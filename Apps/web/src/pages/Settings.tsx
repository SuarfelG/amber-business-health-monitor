import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    timezone: '',
    currency: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stripeStatus, setStripeStatus] = useState<{ status: string; lastSyncAt?: string; connectedAt?: string } | null>(null);
  const [ghlStatus, setGHLStatus] = useState<{ status: string; lastSyncAt?: string; connectedAt?: string } | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [stripeSyncing, setStripeSyncing] = useState(false);
  const [stripeDisconnecting, setStripeDisconnecting] = useState(false);
  const [stripeSyncSuccess, setStripeSyncSuccess] = useState(false);
  const [ghlSyncing, setGhlSyncing] = useState(false);
  const [ghlDisconnecting, setGhlDisconnecting] = useState(false);
  const [ghlSyncSuccess, setGhlSyncSuccess] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      setFormData({
        name: user.name || '',
        businessName: user.businessName || '',
        timezone: user.timezone || '',
        currency: user.currency || '',
      });
      loadIntegrationStatus();
    }
  }, [user, isLoading]);

  const loadIntegrationStatus = async () => {
    try {
      setLoadingIntegrations(true);
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
      console.error('Failed to load integration status', err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  const handleStripeSyncNow = async () => {
    try {
      setStripeSyncing(true);
      await apiClient.syncStripe();
      setStripeSyncSuccess(true);
      setTimeout(() => setStripeSyncSuccess(false), 2000);
      loadIntegrationStatus();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setStripeSyncing(false);
    }
  };

  const handleStripeDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Stripe?')) {
      return;
    }
    try {
      setStripeDisconnecting(true);
      await apiClient.disconnectStripe();
      loadIntegrationStatus();
    } catch (err) {
      console.error('Disconnect failed', err);
    } finally {
      setStripeDisconnecting(false);
    }
  };

  const handleGhlSyncNow = async () => {
    try {
      setGhlSyncing(true);
      await apiClient.syncGHL();
      setGhlSyncSuccess(true);
      setTimeout(() => setGhlSyncSuccess(false), 2000);
      loadIntegrationStatus();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setGhlSyncing(false);
    }
  };

  const handleGhlDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect GoHighLevel?')) {
      return;
    }
    try {
      setGhlDisconnecting(true);
      await apiClient.disconnectGHL();
      loadIntegrationStatus();
    } catch (err) {
      console.error('Disconnect failed', err);
    } finally {
      setGhlDisconnecting(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await apiClient.updateSettings(
        formData.name,
        formData.businessName,
        formData.timezone,
        formData.currency
      );

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Settings updated successfully' });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <p className={isDark ? 'text-gray-500' : 'text-gray-600'}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${
      isDark
        ? 'bg-black text-white'
        : 'bg-white text-gray-900'
    }`}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isDark ? (
          <>
            <div className="absolute top-20 left-10 w-96 h-96 bg-gray-900 rounded-full blur-3xl opacity-40"></div>
            <div className="absolute bottom-0 right-10 w-96 h-96 bg-gray-800 rounded-full blur-3xl opacity-30"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 left-10 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-40"></div>
            <div className="absolute bottom-0 right-10 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-30"></div>
          </>
        )}
      </div>

      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${
        isDark
          ? 'border-gray-800 bg-black/40 backdrop-blur-xl'
          : 'border-gray-200 bg-white/40 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <button
            onClick={() => navigate('/')}
            className={`text-sm font-medium transition ${
              isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-16 relative z-10">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light">
            Account Settings
          </h1>
          <p className={`text-lg mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Manage your profile and preferences
          </p>
        </div>

        {/* Settings Card */}
        <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
            : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
        }`}>
          {/* User Info Section */}
          <div className={`pb-8 border-b transition-colors duration-300 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            <h2 className="text-xl font-light mb-2">Email Address</h2>
            <p className={`text-lg font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {user?.email}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
              Email cannot be changed for security reasons
            </p>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {/* Name */}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Your Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  isDark
                    ? 'bg-gray-800 border border-gray-700 text-white focus:ring-gray-600'
                    : 'bg-gray-100 border border-gray-300 text-gray-900 focus:ring-gray-400'
                }`}
              />
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  isDark
                    ? 'bg-gray-800 border border-gray-700 text-white focus:ring-gray-600'
                    : 'bg-gray-100 border border-gray-300 text-gray-900 focus:ring-gray-400'
                }`}
              />
            </div>

            {/* Timezone & Currency Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    isDark
                      ? 'bg-gray-800 border border-gray-700 text-white focus:ring-gray-600'
                      : 'bg-gray-100 border border-gray-300 text-gray-900 focus:ring-gray-400'
                  }`}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST (UTC-5)</option>
                  <option value="CST">CST (UTC-6)</option>
                  <option value="MST">MST (UTC-7)</option>
                  <option value="PST">PST (UTC-8)</option>
                  <option value="GMT">GMT (UTC+0)</option>
                  <option value="CET">CET (UTC+1)</option>
                  <option value="IST">IST (UTC+5:30)</option>
                  <option value="SGT">SGT (UTC+8)</option>
                  <option value="AEST">AEST (UTC+10)</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    isDark
                      ? 'bg-gray-800 border border-gray-700 text-white focus:ring-gray-600'
                      : 'bg-gray-100 border border-gray-300 text-gray-900 focus:ring-gray-400'
                  }`}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CHF">CHF (Fr)</option>
                  <option value="MXN">MXN ($)</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium transition ${
                message.type === 'success'
                  ? isDark
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-green-50 border border-green-300 text-green-700'
                  : isDark
                  ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                  : 'bg-red-50 border border-red-300 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-medium transition duration-300 disabled:opacity-50 ${
                isDark
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-600 hover:to-gray-800'
                  : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Integrations Status Section */}
        <div className="mt-12">
          <h2 className="text-3xl md:text-4xl font-light mb-8">
            Integration Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stripe Status */}
            <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-light">Stripe</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Payment processing
                  </p>
                </div>
                {stripeStatus?.status === 'CONNECTED' && (
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                )}
              </div>

              {loadingIntegrations ? (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Loading...
                </p>
              ) : (
                <>
                  <div className={`text-sm p-3 rounded-lg ${
                    stripeStatus?.status === 'CONNECTED'
                      ? isDark
                        ? 'bg-green-500/10 text-green-300'
                        : 'bg-green-50 text-green-700'
                      : isDark
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {stripeStatus?.status === 'CONNECTED' ? 'Connected' : 'Not Connected'}
                    {stripeStatus?.lastSyncAt && (
                      <p className="text-xs mt-1">
                        Last sync: {new Date(stripeStatus.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {stripeStatus?.status === 'CONNECTED' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleStripeSyncNow}
                        disabled={stripeSyncing}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          stripeSyncSuccess
                            ? isDark
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-green-50 text-green-700'
                            : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        {stripeSyncing ? 'Syncing...' : stripeSyncSuccess ? 'Synced' : 'Sync Now'}
                      </button>
                      <button
                        onClick={handleStripeDisconnect}
                        disabled={stripeDisconnecting}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition text-red-600 hover:text-red-700 ${
                          isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                        } disabled:opacity-50`}
                      >
                        {stripeDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* GoHighLevel Status */}
            <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-light">GoHighLevel</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    CRM & automation
                  </p>
                </div>
                {ghlStatus?.status === 'CONNECTED' && (
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                )}
              </div>

              {loadingIntegrations ? (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Loading...
                </p>
              ) : (
                <>
                  <div className={`text-sm p-3 rounded-lg ${
                    ghlStatus?.status === 'CONNECTED'
                      ? isDark
                        ? 'bg-green-500/10 text-green-300'
                        : 'bg-green-50 text-green-700'
                      : isDark
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ghlStatus?.status === 'CONNECTED' ? 'Connected' : 'Not Connected'}
                    {ghlStatus?.lastSyncAt && (
                      <p className="text-xs mt-1">
                        Last sync: {new Date(ghlStatus.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {ghlStatus?.status === 'CONNECTED' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleGhlSyncNow}
                        disabled={ghlSyncing}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          ghlSyncSuccess
                            ? isDark
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-green-50 text-green-700'
                            : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        {ghlSyncing ? 'Syncing...' : ghlSyncSuccess ? 'Synced' : 'Sync Now'}
                      </button>
                      <button
                        onClick={handleGhlDisconnect}
                        disabled={ghlDisconnecting}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition text-red-600 hover:text-red-700 ${
                          isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                        } disabled:opacity-50`}
                      >
                        {ghlDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

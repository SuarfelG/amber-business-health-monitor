import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';
import { InviteCollaboratorModal } from '../components/InviteCollaboratorModal';
import { IntegrationModal } from '../components/IntegrationModal';
import { ExpertFeedbackSection } from '../components/ExpertFeedbackSection';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [stripeMetrics, setStripeMetrics] = useState<any[]>([]);
  const [ghlMetrics, setGHLMetrics] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<{ status: string } | null>(null);
  const [ghlStatus, setGHLStatus] = useState<{ status: string } | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const [stripeResult, ghlResult, healthResult, stripeStatusResult, ghlStatusResult] = await Promise.all([
          apiClient.getStripeMetrics('week', 1),
          apiClient.getGHLMetrics('week', 1),
          apiClient.getHealthScore('week'),
          apiClient.getStripeStatus(),
          apiClient.getGHLStatus(),
        ]);
        if (stripeResult.data) {
          setStripeMetrics(stripeResult.data);
        }
        if (ghlResult.data) {
          setGHLMetrics(ghlResult.data);
        }
        if (healthResult.data) {
          setHealthScore(healthResult.data);
        }
        if (stripeStatusResult.data) {
          setStripeStatus(stripeStatusResult.data as any);
        }
        if (ghlStatusResult.data) {
          setGHLStatus(ghlStatusResult.data as any);
        }
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

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
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="relative z-10">
            <h1 className="text-2xl font-light tracking-tight">
              {user?.businessName}
            </h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Business Health Monitor
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 relative z-10">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition duration-300 ${
                isDark
                  ? 'bg-gray-900 hover:bg-gray-800 text-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition duration-300 flex items-center justify-center ${
                  isDark
                    ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white hover:from-gray-600 hover:to-gray-800 shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-900 hover:from-gray-300 hover:to-gray-400 shadow-md hover:shadow-lg'
                }`}
                title={user?.name}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>

              {showUserMenu && (
                <div className={`absolute right-0 mt-3 w-56 rounded-xl shadow-2xl py-1 backdrop-blur-xl z-50 border transition-colors duration-300 ${
                  isDark
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className={`px-4 py-4 border-b transition-colors duration-300 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user?.name}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 text-sm transition ${
                      isDark
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Welcome Section */}
        <div className="mb-16">
          <p className={`text-sm mb-3 tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            WELCOME BACK
          </p>
          <h2 className="text-5xl md:text-6xl font-light leading-tight">
            Here's your <br />
            <span className={`bg-clip-text text-transparent ${
              isDark
                ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100'
                : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900'
            }`}>
              business health
            </span>
          </h2>
        </div>

        {/* Health Status Card */}
        {(() => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'GREEN':
                return { dot: 'bg-green-500', symbol: 'text-green-500', symbol_text: '◆', border: 'border-l-green-500', bg: isDark ? 'bg-green-500/5' : 'bg-green-50' };
              case 'YELLOW':
                return { dot: 'bg-yellow-500', symbol: 'text-yellow-500', symbol_text: '◆', border: 'border-l-yellow-500', bg: isDark ? 'bg-yellow-500/5' : 'bg-yellow-50' };
              case 'RED':
                return { dot: 'bg-red-500', symbol: 'text-red-500', symbol_text: '◆', border: 'border-l-red-500', bg: isDark ? 'bg-red-500/5' : 'bg-red-50' };
              default:
                return { dot: 'bg-gray-500', symbol: 'text-gray-500', symbol_text: '◆', border: 'border-l-gray-500', bg: isDark ? 'bg-gray-500/5' : 'bg-gray-50' };
            }
          };

          const statusColor = getStatusColor(healthScore?.status || 'UNKNOWN');
          const statusLabel = healthScore
            ? healthScore.status === 'GREEN'
              ? 'Everything looks good'
              : healthScore.status === 'YELLOW'
                ? 'Keep an eye on things'
                : healthScore.status === 'RED'
                  ? 'Action needed'
                  : 'Get started'
            : 'Loading...';

          const reasons = healthScore?.reasons || [];
          const recommendation = healthScore?.recommendation || '';

          return (
            <>
              <div
                className={`mb-8 rounded-2xl p-10 shadow-2xl hover:shadow-2xl transition duration-500 group overflow-hidden relative border ${
                  isDark
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black border-gray-700 hover:border-gray-600'
                    : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 border-gray-300 hover:border-gray-400'
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${statusColor.symbol}/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500`}
                ></div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1">
                    <p
                      className={`text-xs mb-4 uppercase tracking-widest ${
                        isDark ? 'text-gray-500' : 'text-gray-600'
                      }`}
                    >
                      Current Status
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <div className={`w-5 h-5 ${statusColor.dot} rounded-full animate-pulse`}></div>
                        <div
                          className={`absolute w-5 h-5 ${statusColor.dot} rounded-full animate-ping opacity-75`}
                        ></div>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-light">{statusLabel}</h3>
                    </div>
                    <p className={`text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {reasons.length > 0
                        ? reasons.join(' • ')
                        : 'Connect integrations to see your health score'}
                    </p>
                  </div>
                  <div className="text-right ml-8">
                    <p className={`text-7xl font-light ${statusColor.symbol}`}>{statusColor.symbol_text}</p>
                    <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      Last updated today
                    </p>
                  </div>
                </div>
              </div>

              {healthScore && healthScore.status !== 'UNKNOWN' && recommendation && (
                <div className={`mb-16 rounded-xl p-5 border-l-4 ${statusColor.border} ${statusColor.bg}`}>
                  <p className={`text-sm font-light leading-relaxed ${
                    isDark
                      ? healthScore.status === 'GREEN' ? 'text-green-300' : healthScore.status === 'YELLOW' ? 'text-yellow-300' : 'text-red-300'
                      : healthScore.status === 'GREEN' ? 'text-green-700' : healthScore.status === 'YELLOW' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {recommendation}
                  </p>
                </div>
              )}
            </>
          );
        })()}

        {/* Snapshots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Weekly Snapshot */}
          <div className={`rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-500 group overflow-hidden relative border ${
            isDark
              ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-gray-600'
              : 'bg-gradient-to-br from-gray-50 to-white border-gray-300 hover:border-gray-400'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className={`text-xs uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Weekly Snapshot
                  </p>
                  <h3 className="text-2xl font-light">
                    This Week
                  </h3>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full border ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-blue-100 text-blue-700 border-blue-300'
                }`}>
                  Feb 13 - 19
                </span>
              </div>

              <div className="space-y-5 mb-8">
                <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Revenue</span>
                  <span className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {loadingMetrics ? '...' : stripeMetrics.length > 0 ? `$${stripeMetrics[0].netRevenue.toLocaleString()}` : '—'}
                  </span>
                </div>
                <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Clients</span>
                  <span className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {loadingMetrics ? '...' : stripeMetrics.length > 0 ? stripeMetrics[0].customerCount : '—'}
                  </span>
                </div>
                <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Charges</span>
                  <span className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {loadingMetrics ? '...' : stripeMetrics.length > 0 ? stripeMetrics[0].chargeCount : '—'}
                  </span>
                </div>
              </div>

              <div className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  💡 Connect your integrations to see live data
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Snapshot */}
          <div className={`rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-500 group overflow-hidden relative border ${
            isDark
              ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-gray-600'
              : 'bg-gradient-to-br from-gray-50 to-white border-gray-300 hover:border-gray-400'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className={`text-xs uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Monthly Snapshot
                  </p>
                  <h3 className="text-2xl font-light">
                    February 2026
                  </h3>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full border ${
                  isDark
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border-purple-300'
                }`}>
                  In Progress
                </span>
              </div>

              <div className="space-y-5 mb-8">
                <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Leads</span>
                  <span className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {loadingMetrics ? '...' : ghlMetrics.length > 0 ? ghlMetrics[0].leadsCount : '—'}
                  </span>
                </div>
                <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Show Rate</span>
                  <span className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {loadingMetrics ? '...' : ghlMetrics.length > 0 ? `${(ghlMetrics[0].showRate * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Deals Won</span>
                  <span className={`text-xl font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {loadingMetrics ? '...' : ghlMetrics.length > 0 ? ghlMetrics[0].opportunitiesWon : '—'}
                  </span>
                </div>
              </div>

              <div className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  📊 Full report available at month end
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {(() => {
          const isStripeConnected = stripeStatus?.status === 'CONNECTED';
          const isGhlConnected = ghlStatus?.status === 'CONNECTED';
          const connectedCount = (isStripeConnected ? 1 : 0) + (isGhlConnected ? 1 : 0);

          let integrationLabel = 'Connect integrations';
          let integrationDot = 'bg-gray-500';

          if (connectedCount === 2) {
            integrationLabel = 'Integrations connected ✓';
            integrationDot = 'bg-green-500';
          } else if (connectedCount === 1) {
            integrationLabel = '1 of 2 integrations connected';
            integrationDot = 'bg-yellow-500';
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <button
                onClick={() => setShowIntegrationModal(true)}
                className={`rounded-xl p-6 hover:shadow-xl transition duration-500 text-left group overflow-hidden relative border ${
                isDark
                  ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-gray-600'
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 hover:border-gray-400'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 ${integrationDot} rounded-full`}></div>
                    <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      Next Step
                    </p>
                  </div>
                  <p className={`text-lg font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {integrationLabel}
                  </p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Set up GoHighLevel, Stripe, etc.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowInviteModal(true)}
                className={`rounded-xl p-6 hover:shadow-xl transition duration-500 text-left group overflow-hidden relative border ${
                isDark
                  ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-gray-600'
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 hover:border-gray-400'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10">
                  <p className={`text-xs mb-3 uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Collaboration
                  </p>
                  <p className={`text-lg font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Invite your advisor
                  </p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Get expert insights
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/settings')}
                className={`rounded-xl p-6 hover:shadow-xl transition duration-500 text-left group overflow-hidden relative border ${
                isDark
                  ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-gray-600'
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 hover:border-gray-400'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative z-10">
                  <p className={`text-xs mb-3 uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Settings
                  </p>
                  <p className={`text-lg font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Manage account
                  </p>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Timezone, currency, billing
                  </p>
                </div>
              </button>
            </div>
          );
        })()}

        {/* Expert Feedback Section */}
        <div className="mt-16">
          <ExpertFeedbackSection />
        </div>
      </main>

      {/* Invite Collaborator Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Integration Modal */}
      <IntegrationModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
      />
    </div>
  );
};

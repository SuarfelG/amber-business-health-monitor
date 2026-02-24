import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  timezone: string;
  currency: string;
  createdAt: string;
}

export const ExpertDashboard: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expertName, setExpertName] = useState('');
  const [opinion, setOpinion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiClient.getInvitation(token);

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setUser(result.data.user);
        }
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !expertName.trim() || !opinion.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiClient.submitFeedback(
        token,
        expertName,
        opinion
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitSuccess(true);
        setExpertName('');
        setOpinion('');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <p className={isDark ? 'text-gray-500' : 'text-gray-600'}>
          Loading invitation...
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center">
          <p className={`text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error || 'Invalid invitation'}
          </p>
        </div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light tracking-tight">
                {user.businessName}
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                Expert Review
              </p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full border ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border-blue-300'
            }`}>
              Read-only
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Dashboard Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <p className={`text-sm mb-3 tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                BUSINESS OVERVIEW
              </p>
              <h2 className="text-4xl md:text-5xl font-light">
                {user.name}'s Business
              </h2>
            </div>

            {/* Health Status Card */}
            <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 mb-8 ${
              isDark
                ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-xs mb-4 uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Current Status
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="absolute w-5 h-5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-light">
                      Everything looks good
                    </h3>
                  </div>
                  <p className={`text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    All metrics within healthy range • System performing optimally
                  </p>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
            }`}>
              <h3 className="text-xl font-light mb-6">Business Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Owner Name
                  </p>
                  <p className={`text-lg font-light mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {user.name}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Timezone
                  </p>
                  <p className={`text-lg font-light mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {user.timezone}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Currency
                  </p>
                  <p className={`text-lg font-light mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {user.currency}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Member Since
                  </p>
                  <p className={`text-lg font-light mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Form Section */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 sticky top-24 ${
              isDark
                ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
            }`}>
              <h3 className="text-xl font-light mb-6">Share Your Feedback</h3>

              {submitSuccess ? (
                <div className={`p-4 rounded-lg text-center ${
                  isDark
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-green-50 border border-green-300 text-green-700'
                }`}>
                  <p className="font-medium">✓ Feedback submitted!</p>
                  <p className="text-sm mt-2">Redirecting...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={expertName}
                      onChange={(e) => setExpertName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
                        isDark
                          ? 'bg-gray-800 border border-gray-700 text-white focus:ring-gray-600'
                          : 'bg-gray-100 border border-gray-300 text-gray-900 focus:ring-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Your Opinion
                    </label>
                    <textarea
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value)}
                      placeholder="Share your thoughts on this business..."
                      rows={6}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 resize-none ${
                        isDark
                          ? 'bg-gray-800 border border-gray-700 text-white focus:ring-gray-600'
                          : 'bg-gray-100 border border-gray-300 text-gray-900 focus:ring-gray-400'
                      }`}
                    />
                  </div>

                  {error && (
                    <div className={`p-3 rounded-lg text-sm ${
                      isDark
                        ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                        : 'bg-red-50 border border-red-300 text-red-700'
                    }`}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !expertName.trim() || !opinion.trim()}
                    className={`w-full py-3 rounded-lg font-medium transition disabled:opacity-50 ${
                      isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

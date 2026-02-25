import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';

export const StripeCallback: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting Stripe...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state. Please try again.');
          setTimeout(() => navigate('/settings'), 3000);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/stripe/oauth/callback?code=${code}&state=${state}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${apiClient.getAccessToken()}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Failed to connect Stripe');
          setTimeout(() => navigate('/settings'), 3000);
          return;
        }

        setStatus('success');
        setMessage('Stripe connected successfully!');
        setTimeout(() => navigate('/settings'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage('Connection failed. Please try again.');
        setTimeout(() => navigate('/settings'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${
      isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{message}</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-600 text-4xl mb-4">✕</div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{message}</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Redirecting to settings...</p>
          </>
        )}
      </div>
    </div>
  );
};

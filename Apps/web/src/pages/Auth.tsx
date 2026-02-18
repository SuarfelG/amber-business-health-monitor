import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name, businessName, timezone, currency);
      }
      setEmail('');
      setPassword('');
      setName('');
      setBusinessName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">
            {isLogin ? 'Welcome back.' : 'Create your account.'}
          </h1>
          <p className="text-gray-500">
            {isLogin
              ? 'Log in to your business health monitor'
              : 'Join to start monitoring your business'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium mb-2"
                >
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business Co."
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium mb-2"
                  >
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
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

                <div>
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium mb-2"
                  >
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
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
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
              }}
              className="text-gray-900 font-medium hover:underline"
            >
              {isLogin ? 'Create one' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

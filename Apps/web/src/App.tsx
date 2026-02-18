import React from 'react';
import { useAuth } from './AuthContext';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <Home /> : <Auth />;
};

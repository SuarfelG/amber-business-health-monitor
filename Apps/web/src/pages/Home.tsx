import React from 'react';
import { useAuth } from '../AuthContext';

export const Home: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light text-gray-900">
              {user?.businessName}
            </h1>
            <p className="text-gray-500 mt-2">
              Welcome, {user?.name}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Log out
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Timezone</p>
              <p className="text-lg font-medium text-gray-900">{user?.timezone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="text-lg font-medium text-gray-900">{user?.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-lg font-medium text-gray-900">{user?.role}</p>
            </div>
          </div>

          <p className="text-gray-500 text-center mt-8">
            Coming soon: Weekly and monthly business health snapshots
          </p>
        </div>
      </div>
    </div>
  );
};

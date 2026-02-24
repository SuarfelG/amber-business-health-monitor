import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';

interface Feedback {
  id: string;
  expertName: string;
  opinion: string;
  createdAt: string;
}

export const ExpertFeedbackSection: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const result = await apiClient.getFeedback();

        if (result.data) {
          setFeedback(result.data);
        }
      } catch (err) {
        // Silently fail, just show empty state
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (isLoading) {
    return (
      <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
          : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
      }`}>
        <h3 className="text-2xl font-light mb-6">Expert Feedback</h3>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          Loading feedback...
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-8 shadow-xl border transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 to-black border-gray-700'
        : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
    }`}>
      <h3 className="text-2xl font-light mb-6">Expert Feedback</h3>

      {feedback.length === 0 ? (
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          No feedback yet. Invite collaborators to get their insights on your
          business.
        </p>
      ) : (
        <div className="space-y-6">
          {feedback.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className={`font-medium ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {item.expertName}
                </h4>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {item.opinion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

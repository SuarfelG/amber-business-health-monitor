import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { apiClient } from '../api';

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvitation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[InviteModal] Generating invitation...');
      const result = await apiClient.createInvitation();

      if (result.error) {
        console.error('[InviteModal] Error:', result.error);
        setError(result.error);
      } else if (result.data) {
        console.log('[InviteModal] Invitation created successfully');
        setInvitationUrl(result.data.url);
      }
    } catch (err) {
      console.error('[InviteModal] Exception:', err);
      setError('Failed to generate invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setInvitationUrl(null);
    setError(null);
    setIsCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl p-8 shadow-2xl max-w-md w-full transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-gray-900 to-black border border-gray-700'
            : 'bg-white border border-gray-300'
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light">Invite Collaborator</h2>
          <button
            onClick={handleClose}
            className={`text-2xl leading-none transition ${
              isDark
                ? 'text-gray-500 hover:text-white'
                : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            ×
          </button>
        </div>

        {!invitationUrl ? (
          <>
            <p
              className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Generate a unique link to share with an expert. They'll be able to
              view your dashboard and provide feedback on your business.
            </p>

            {error && (
              <div className={`p-3 rounded-lg text-sm mb-6 ${
                isDark
                  ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                  : 'bg-red-50 border border-red-300 text-red-700'
              }`}>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateInvitation}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-medium transition disabled:opacity-50 ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate Invitation Link'}
            </button>
          </>
        ) : (
          <>
            <p className={`text-sm mb-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Share this link with an expert:
            </p>

            <div className={`p-4 rounded-lg mb-4 break-all font-mono text-sm ${
              isDark
                ? 'bg-gray-800 border border-gray-700 text-gray-300'
                : 'bg-gray-100 border border-gray-300 text-gray-700'
            }`}>
              {invitationUrl}
            </div>

            <button
              onClick={handleCopyUrl}
              className={`w-full py-3 rounded-lg font-medium transition mb-4 ${
                isCopied
                  ? isDark
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-green-50 text-green-700 border border-green-300'
                  : isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isCopied ? '✓ Copied!' : 'Copy Link'}
            </button>

            <button
              onClick={handleClose}
              className={`w-full py-2 rounded-lg text-sm transition ${
                isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};

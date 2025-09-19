import React, { useState } from 'react';

interface ResetPasswordProps {
  token: string;
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password has been reset successfully!');
        // Clear form
        setNewPassword('');
        setConfirmPassword('');
        // After 2 seconds, redirect to login
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        // Handle specific error types from our enhanced backend
        if (data.field === 'token') {
          setError(data.message || 'Invalid or expired reset token');
        } else if (data.field === 'password') {
          setError(data.message || 'Invalid password');
        } else {
          setError(data.message || data.error || 'Failed to reset password');
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="sr-only">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Login
            </button>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          {message && (
            <div className="text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
              {message}
              {message.includes('successfully') && (
                <div className="mt-1 text-xs">
                  Redirecting to login in 2 seconds...
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

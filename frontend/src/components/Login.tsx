import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, API_ENDPOINTS } from '../utils/api';
import Button from './ui/Button';
import ErrorDisplay from './ErrorDisplay';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setIsResetting(true);

    try {
      await apiRequest(API_ENDPOINTS.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });

      setResetMessage('Password reset instructions have been sent to your email address.');
      setResetEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
      }, 3000);
    } catch (err: any) {
      setResetMessage(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-light-grey">
          {!showForgotPassword ? (
            <>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src="/favicon.svg" 
                    alt="J11 Logo" 
                    width="40" 
                    height="40" 
                    className="mr-3"
                  />
                  <h1 className="text-3xl font-bold text-black">Production Manager</h1>
                </div>
                <p className="text-charcoal">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                    Email / Username
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-light-grey rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Enter your email or username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-light-grey rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Enter your password"
                  />
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:opacity-80 transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                {error && (
                  <ErrorDisplay 
                    type="error" 
                    message={error}
                    onDismiss={() => setError('')}
                  />
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full"
                >
                  Sign In
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src="/favicon.svg" 
                    alt="J11 Logo" 
                    width="40" 
                    height="40" 
                    className="mr-3"
                  />
                  <h1 className="text-3xl font-bold text-black">Reset Password</h1>
                </div>
                <p className="text-charcoal">Enter your email to receive reset instructions</p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-black mb-2">
                    Email Address
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-light-grey rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Enter your email address"
                  />
                </div>

                {resetMessage && (
                  <ErrorDisplay 
                    type={resetMessage.includes('sent') ? 'info' : 'error'}
                    message={resetMessage}
                    onDismiss={() => setResetMessage('')}
                  />
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetMessage('');
                      setResetEmail('');
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResetting}
                    variant="primary"
                    loading={isResetting}
                    className="flex-1"
                  >
                    Send Reset Email
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

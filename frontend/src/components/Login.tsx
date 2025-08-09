import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (response.ok) {
        setResetMessage('Password reset instructions have been sent to your email address.');
        setResetEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetMessage('');
        }, 3000);
      } else {
        const data = await response.json();
        setResetMessage(data.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setResetMessage('Network error. Please check your connection and try again.');
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary hover:opacity-90 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
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
                  <div className={`border rounded-lg p-3 ${
                    resetMessage.includes('sent') 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      resetMessage.includes('sent') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {resetMessage}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetMessage('');
                      setResetEmail('');
                    }}
                    className="flex-1 py-3 px-4 bg-light-grey hover:bg-gray-300 text-charcoal font-semibold rounded-lg transition-all"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-3 px-4 bg-primary hover:opacity-90 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all"
                  >
                    {isResetting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send Reset Email'
                    )}
                  </button>
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

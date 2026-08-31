import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, ShieldAlert, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/auth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotBanner, setShowForgotBanner] = useState(false);

  // Form Validation
  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return false;
    }
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setShowForgotBanner(false);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      setSuccessMsg(`Welcome back, ${user.name}! Redirecting...`);
      
      // Delay navigation slightly so they see the success message
      setTimeout(() => {
        switch (user.role as string) {
          case 'USER':
          case 'DONOR':
          case 'RECEIVER':
            navigate('/dashboard');
            break;
          case 'HOSPITAL':
            navigate('/hospital/dashboard');
            break;
          case 'ADMIN':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address to recover your password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setShowForgotBanner(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-rose-200/20 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-100/20 blur-3xl -z-10" />

      {/* Floating Home Link */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-lg shadow-rose-200 flex items-center justify-center">
            <Heart className="h-6 w-6 fill-current animate-pulse" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Raktsetu
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Connect, verify, and coordinate blood support.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          
          {/* Display Errors */}
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Display Success */}
          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl flex items-start gap-2.5 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Display Simulated Forgot Password Banner */}
          {showForgotBanner && (
            <div className="mb-4 bg-blue-50 border border-blue-100 text-blue-800 p-3.5 rounded-xl flex flex-col gap-1 text-xs leading-relaxed font-semibold">
              <span className="flex items-center gap-1.5 text-blue-700 text-sm">
                <Sparkles className="h-4 w-4" /> Password Recovery Sent
              </span>
              <span>A password reset link has been dispatched to <strong>{email}</strong> (Simulated).</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <a
                  href="#"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Login CTA */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Account Redirect */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 font-semibold">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-rose-600 hover:text-rose-700 transition-colors">
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

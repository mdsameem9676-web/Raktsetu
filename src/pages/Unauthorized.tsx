import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { authService } from '../services/auth';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const session = authService.getCurrentSession();

  const handleDashboardRedirect = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    
    switch (session.user.role as string) {
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
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-100 shadow-xl text-center">
        
        {/* Warning Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-6 mx-auto border border-rose-100">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Access Denied
        </h1>
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          You are not authorized to view this page. If you believe this is in error, please verify that you are logged into the correct account.
        </p>

        {/* Dynamic Buttons */}
        <div className="flex flex-col gap-3">
          {session ? (
            <button
              onClick={handleDashboardRedirect}
              className="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors shadow-sm text-sm"
            >
              Go to Your Dashboard ({session.user.role})
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full bg-rose-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-rose-755 text-center transition-colors shadow-sm text-sm inline-block"
            >
              Log In to Authorize
            </Link>
          )}

          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go Back
            </button>
            <span className="text-slate-300">|</span>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              <Home className="h-3.5 w-3.5" />
              Return Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Logo from './Logo';
import useAuth from '../hooks/useAuth';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    // Simple authentication logic using the useAuth hook
    setTimeout(() => {
      const success = login(accessCode);
      if (success) {
        onLogin();
      } else {
        setError(true);
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-900 via-orange-400 to-indigo-900"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 text-center border-b border-slate-50">
            <div className="flex justify-center mb-6">
              <Logo className="h-10" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-900">Strategic Simulator</h2>
            <p className="text-slate-500 mt-2">School District Budget & Resource Allocation</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="access-code" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Access Code
                </label>
                <div className={`relative flex items-center border-2 rounded-xl transition-all ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-indigo-500'}`}>
                  <div className="pl-4 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="access-code"
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter simulation code"
                    className="w-full py-4 px-4 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-300"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Invalid access code. Please try again.</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!accessCode || isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Secure Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Restricted Access: Education Associates Internal Only</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs">
            © {new Date().getFullYear()} Education Associates. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

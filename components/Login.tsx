
import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Logo from './Logo';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(false);
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (e: any) {
      console.error('Login failed', e);
      let errorMsg = 'Failed to sign in. Please try again.';
      if (e.code === 'auth/unauthorized-domain') {
        errorMsg = 'Wait! The custom domain you deployed to is not authorized in Firebase! You must go to your Firebase Console -> Authentication -> Settings -> Authorized Domains and add "school-district-budget-simulator.education.associates" to the list.';
      } else if (e.code === 'auth/operation-not-allowed') {
        errorMsg = 'Google Sign-In is not enabled. Go to Firebase Console -> Authentication -> Sign-in method and enable Google.';
      } else if (e.message) {
        errorMsg = `Error: ${e.message}`;
      }
      setError(errorMsg as any);
      setIsSubmitting(false);
    }
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
            <div className="space-y-6">
              {error && (
                <div className="mb-3 flex p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in slide-in-from-top-1 text-left items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign in with Google <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Restricted Access: Valid Google Account Required</span>
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

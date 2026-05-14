import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader, Shield, Lock, ChevronRight } from 'lucide-react';

interface Props {
  onGoSignup: () => void;
  onForgotPassword: () => void;
  onAdminLogin: () => void;
}

export default function LoginPage({ onGoSignup, onForgotPassword, onAdminLogin }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <div className="w-full max-w-[400px]">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 text-white rounded-xl mb-6 shadow-xl shadow-slate-200">
            <Lock size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-2">Sign In</h1>
          <p className="text-slate-500 text-sm font-medium">Access your business dashboard</p>
        </div>

        {/* Login Form */}
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex gap-3">
                <div className="shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-900 leading-tight">Account Restricted</p>
                  <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                    {error.includes('deactivated') || error.includes('approval') 
                      ? "Your business account is pending approval or has been deactivated. Please contact support." 
                      : error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="e.g. manager@istore.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-950 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:bg-white transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-950 transition-colors uppercase tracking-wider"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 pr-14 text-slate-950 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:bg-white transition-all duration-300"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-950 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold py-4.5 rounded-xl shadow-xl shadow-slate-200 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 mt-4 group"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-bold">Sign In</span>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 text-center">
            <p className="text-xs font-medium text-slate-400">
              New here?{' '}
              <button 
                onClick={onGoSignup} 
                className="text-slate-950 font-bold hover:underline underline-offset-4 decoration-2"
              >
                Register Staff
              </button>
            </p>
          </div>
        </div>

        {/* Footer / Version */}
        <div className="mt-20 flex flex-col items-center gap-8">
          <button 
            onClick={onAdminLogin}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all duration-500"
          >
            <Shield size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-600 uppercase tracking-[0.2em] transition-colors">Developer Portal</span>
          </button>
          
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              EPOS Systems v4.1.0
            </p>
            <p className="text-[9px] font-medium text-slate-200 uppercase tracking-widest">
              &copy; 2026 ICover Global
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

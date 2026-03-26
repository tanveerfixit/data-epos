import { useState } from 'react';
import { Smartphone, Loader, CheckCircle, ArrowLeft } from 'lucide-react';

interface Props { onGoLogin: () => void; }

export default function ForgotPassword({ onGoLogin }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2535] to-[#2c3e50] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3498db]/20 border border-[#3498db]/40 rounded-2xl mb-4">
            <Smartphone size={32} className="text-[#3498db]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">We'll send you a reset link</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Check your email</h3>
              <p className="text-slate-400 text-sm mb-6">If an account exists for <strong className="text-white">{email}</strong>, we've sent a password reset link. It expires in 1 hour.</p>
              <button onClick={onGoLogin} className="bg-[#3498db] hover:bg-[#2980b9] text-white font-semibold py-2 px-6 rounded-lg transition">Back to Sign In</button>
            </div>
          ) : (
            <>
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 mb-5 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3498db]/50 transition" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                  {loading ? <><Loader size={16} className="animate-spin" />Sending...</> : 'Send Reset Link'}
                </button>
              </form>
              <button onClick={onGoLogin} className="mt-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition mx-auto">
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

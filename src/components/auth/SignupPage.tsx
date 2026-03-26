import { useState, useEffect } from 'react';
import { Smartphone, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';

interface Props { onGoLogin: () => void; }

export default function SignupPage({ onGoLogin }: Props) {
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', branch_id: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(setBranches);
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, branch_id: Number(form.branch_id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2535] to-[#2c3e50] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 shadow-2xl">
            <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Account Requested!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your account is <strong className="text-yellow-300">pending admin approval</strong>. You'll receive an email once it's approved.
            </p>
            <button onClick={onGoLogin} className="bg-[#3498db] hover:bg-[#2980b9] text-white font-semibold py-2.5 px-8 rounded-lg transition">
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2535] to-[#2c3e50] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3498db]/20 border border-[#3498db]/40 rounded-2xl mb-4">
            <Smartphone size={32} className="text-[#3498db]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Request access to Phone Lab EPOS</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 mb-5 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="John Doe"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3498db]/50 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3498db]/50 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Branch</label>
              <select value={form.branch_id} onChange={set('branch_id')} required
                className="w-full bg-[#1a2535] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/50 transition">
                <option value="">Select your branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 6 characters"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3498db]/50 transition" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} required placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3498db]/50 transition" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader size={16} className="animate-spin" /> Creating...</> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <button onClick={onGoLogin} className="text-[#3498db] hover:text-[#2980b9] font-medium transition">Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  GitBranch, 
  Mail, 
  CheckCircle, 
  XCircle, 
  UserX, 
  Edit2, 
  Trash2, 
  Plus, 
  Loader, 
  Save, 
  Eye, 
  EyeOff, 
  Key, 
  Shield, 
  LogOut,
  Building,
  Search
} from 'lucide-react';

type Tab = 'users' | 'branches' | 'smtp' | 'access' | 'businesses';

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  rejected: 'bg-rose-50 text-rose-600 border-rose-100',
  inactive: 'bg-slate-50 text-slate-500 border-slate-100',
};

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  const { token, currentUser } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [smtp, setSmtp] = useState<any>({ host: 'smtp.hostinger.com', port: 465, secure: true, user: '', pass: '', from_name: 'EPOS', from_email: '' });
  const [showPass, setShowPass] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [editUser, setEditUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [accessSettings, setAccessSettings] = useState({ allow_signup: true, allow_signin: true });
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessMsg, setAccessMsg] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [editBusiness, setEditBusiness] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = () => fetch('/api/admin/users', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? setUsers(d) : null);
  const loadBranches = () => fetch('/api/admin/branches', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? setBranches(d) : null);
  const loadSmtp = () => fetch('/api/admin/smtp', { headers }).then(r => r.json()).then(setSmtp);
  const loadAccess = () => fetch('/api/settings', { headers }).then(r => r.json()).then(s => {
    if (s) setAccessSettings({ allow_signup: s.allow_signup !== 0, allow_signin: s.allow_signin !== 0 });
  });
  const loadBusinesses = () => {
    if (currentUser?.role === 'developer') {
      fetch('/api/admin/system/businesses', { headers })
        .then(r => r.json())
        .then(d => Array.isArray(d) ? setBusinesses(d) : null);
    }
  };

  useEffect(() => { loadUsers(); loadBranches(); loadSmtp(); loadAccess(); loadBusinesses(); }, []);

  const pendingCount = Array.isArray(users) ? users.filter(u => u.status === 'pending').length : 0;
  const pendingBusinessCount = Array.isArray(businesses) ? businesses.filter(b => b.status === 'inactive' || b.status === 'pending').length : 0;

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };
  const showSmtpMsg = (msg: string) => { setSmtpMsg(msg); setTimeout(() => setSmtpMsg(''), 4000); };
  const showAccessMsg = (msg: string) => { setAccessMsg(msg); setTimeout(() => setAccessMsg(''), 4000); };

  const updateStatus = async (userId: number, status: string) => {
    await fetch(`/api/admin/users/${userId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    loadUsers();
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Remove this user permanently?')) return;
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers });
    loadUsers();
  };

  const saveUser = async () => {
    if (!editUser) return;
    setLoading(true);
    await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ name: editUser.name, branch_id: editUser.branch_id, role: editUser.role, password: editUser.newPassword || undefined }),
    });
    setEditUser(null); setLoading(false); loadUsers();
  };

  const resetUserPassword = async (userId: number, userName: string) => {
    if (!confirm(`Reset password for ${userName} and send it by email?`)) return;
    setLoading(true);
    const r = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST', headers });
    const data = await r.json();
    showMsg(r.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    setLoading(false);
  };

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/branches', { method: 'POST', headers, body: JSON.stringify(newBranch) });
    setNewBranch({ name: '', address: '', phone: '' });
    loadBranches();
  };

  const saveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true); setSmtpMsg('');
    try {
      const res = await fetch('/api/admin/smtp', { method: 'PUT', headers, body: JSON.stringify({ ...smtp, secure: smtp.secure ? 1 : 0 }) });
      showSmtpMsg(res.ok ? '✓ Settings saved' : '✗ Failed to save');
    } finally { setSmtpLoading(false); }
  };

  const testSmtp = async () => {
    setSmtpLoading(true); setSmtpMsg('');
    try {
      const res = await fetch('/api/admin/smtp/test', { method: 'POST', headers });
      const data = await res.json();
      showSmtpMsg(res.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    } finally { setSmtpLoading(false); }
  };

  const saveAccess = async () => {
    setAccessLoading(true); setAccessMsg('');
    try {
      const res = await fetch('/api/settings/auth', { method: 'POST', headers, body: JSON.stringify(accessSettings) });
      showAccessMsg(res.ok ? '✓ Saved' : '✗ Failed to save');
    } finally { setAccessLoading(false); }
  };

  const updateBusinessStatus = async (businessId: number, status: string) => {
    await fetch(`/api/admin/system/businesses/${businessId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    loadBusinesses();
  };

  const saveBusiness = async () => {
    if (!editBusiness) return;
    setLoading(true);
    await fetch(`/api/admin/system/businesses/${editBusiness.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify(editBusiness),
    });
    setEditBusiness(null); setLoading(false); loadBusinesses();
  };

  const filteredUsers = Array.isArray(users) ? users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="fixed inset-0 z-[60] flex font-sans bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Admin Panel</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'users', label: 'Staff', icon: Users, badge: pendingCount },
              { id: 'branches', label: 'Branches', icon: GitBranch },
              { id: 'smtp', label: 'Email', icon: Mail },
              { id: 'access', label: 'Security', icon: Shield },
              ...(currentUser?.role === 'developer'
                ? [{ id: 'businesses', label: 'Businesses', icon: Building, badge: pendingBusinessCount }] : []),
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  tab === t.id 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <t.icon size={16} />
                <span className="flex-1 text-left">{t.label}</span>
                {t.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[10px] rounded font-bold">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Online</span>
          </div>
          <button 
            onClick={onClose}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 capitalize">
            {tab}
          </h2>
          
          <div className="flex items-center gap-4">
            {actionMsg && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded">
                {actionMsg}
              </span>
            )}
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{currentUser?.name}</div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{currentUser?.role}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {/* USERS TAB */}
            {tab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>

                {editUser && (
                  <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm mb-6">
                    <h3 className="font-bold text-slate-900 mb-4">Edit User</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Name</label>
                        <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Branch</label>
                        <select value={editUser.branch_id} onChange={e => setEditUser({ ...editUser, branch_id: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Role</label>
                        <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none">
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">New Password</label>
                        <input type="password" placeholder="••••••••"
                          onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveUser} disabled={loading} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2">
                        {loading && <Loader size={14} className="animate-spin" />} Save
                      </button>
                      <button onClick={() => setEditUser(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-md text-sm font-bold">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 font-bold text-slate-500 text-[11px] uppercase">Name</th>
                        <th className="px-6 py-3 font-bold text-slate-500 text-[11px] uppercase">Branch</th>
                        <th className="px-6 py-3 font-bold text-slate-500 text-[11px] uppercase">Status</th>
                        <th className="px-6 py-3 font-bold text-slate-500 text-[11px] uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-600">{u.branch_name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{u.role}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[u.status] || statusColors.inactive}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {u.status === 'pending' && (
                                <>
                                  <button onClick={() => updateStatus(u.id, 'approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve"><CheckCircle size={16} /></button>
                                  <button onClick={() => updateStatus(u.id, 'rejected')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Reject"><XCircle size={16} /></button>
                                </>
                              )}
                              {(u.status === 'inactive' || u.status === 'rejected') && (
                                <button onClick={() => updateStatus(u.id, 'approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Reactivate"><CheckCircle size={16} /></button>
                              )}
                              {u.status === 'approved' && u.email !== 'support@techinbox.ie' && (
                                <button onClick={() => updateStatus(u.id, 'inactive')} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded" title="Deactivate"><UserX size={16} /></button>
                              )}
                              <button onClick={() => setEditUser({ ...u, newPassword: '' })} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded" title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => resetUserPassword(u.id, u.name)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded" title="Reset Password"><Key size={16} /></button>
                              <button onClick={() => deleteUser(u.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Delete"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BRANCHES TAB */}
            {tab === 'branches' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Plus size={16} /> Add Branch</h3>
                    <form onSubmit={createBranch} className="space-y-3">
                      <input value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} required 
                        placeholder="Name" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      <input value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                        placeholder="Address" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      <input value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                        placeholder="Phone" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-md text-sm mt-2">Save</button>
                    </form>
                  </div>

                  {branches.map(b => (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded flex items-center justify-center font-bold">{b.name.charAt(0)}</div>
                        <span className="text-[10px] font-bold text-slate-300">ID {b.id}</span>
                      </div>
                      <h4 className="font-bold text-slate-900">{b.name}</h4>
                      <p className="text-xs text-slate-500 mt-2 flex-1">{b.address}</p>
                      <div className="text-xs font-bold text-slate-900 mt-4">{b.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SMTP TAB */}
            {tab === 'smtp' && (
              <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-8">
                <h3 className="text-lg font-bold mb-6">Email Settings</h3>
                <form onSubmit={saveSmtp} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">SMTP Host</label>
                      <input value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Port</label>
                      <input type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={smtp.secure} onChange={e => setSmtp({ ...smtp, secure: e.target.checked })} id="secure" className="w-4 h-4 rounded border-slate-300" />
                    <label htmlFor="secure" className="text-xs font-bold text-slate-700">Use SSL/TLS</label>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Email User</label>
                      <input type="email" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Password</label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })}
                          className="w-full border border-slate-200 rounded-md pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Sender Name</label>
                      <input value={smtp.from_name} onChange={e => setSmtp({ ...smtp, from_name: e.target.value })}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Sender Email</label>
                      <input type="email" value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })}
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={smtpLoading} className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      {smtpLoading && <Loader size={14} className="animate-spin" />} Save Settings
                    </button>
                    <button type="button" onClick={testSmtp} disabled={smtpLoading} className="px-6 bg-slate-100 text-slate-900 font-bold py-2.5 rounded-md text-sm border border-slate-200 flex items-center justify-center gap-2">
                      {smtpLoading && <Loader size={14} className="animate-spin" />} Send Test
                    </button>
                  </div>
                </form>
                {smtpMsg && (
                  <div className={`mt-4 p-3 rounded text-xs font-bold border ${smtpMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {smtpMsg}
                  </div>
                )}
              </div>
            )}

            {/* BUSINESSES TAB */}
            {tab === 'businesses' && currentUser?.role === 'developer' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Manage Businesses</h3>
                  {pendingBusinessCount > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded">
                      {pendingBusinessCount} PENDING APPROVAL
                    </span>
                  )}
                </div>

                {editBusiness && (
                  <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm mb-6">
                    <h4 className="font-bold mb-6">Edit Business</h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Name</label>
                        <input value={editBusiness.name || ''} onChange={e => setEditBusiness({ ...editBusiness, name: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Slug (Public URL)</label>
                        <input value={editBusiness.slug || ''} onChange={e => setEditBusiness({ ...editBusiness, slug: e.target.value })}
                          placeholder="business-name"
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Email</label>
                        <input type="email" value={editBusiness.email || ''} onChange={e => setEditBusiness({ ...editBusiness, email: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Phone</label>
                        <input value={editBusiness.phone || ''} onChange={e => setEditBusiness({ ...editBusiness, phone: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Address</label>
                        <input value={editBusiness.address || ''} onChange={e => setEditBusiness({ ...editBusiness, address: e.target.value })}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveBusiness} disabled={loading} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2">
                        {loading && <Loader size={14} className="animate-spin" />} Save Changes
                      </button>
                      <button onClick={() => setEditBusiness(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-md text-sm font-bold">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {businesses.map(b => (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-400">{b.name.charAt(0)}</div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-slate-900">{b.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${statusColors[b.status] || statusColors.inactive}`}>{b.status}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{b.email} • ID: {b.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(b.status === 'inactive' || b.status === 'pending') && (
                          <button onClick={() => updateBusinessStatus(b.id, 'active')} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded transition-colors hover:bg-emerald-700">Approve</button>
                        )}
                        {b.status === 'active' && (
                          <button onClick={() => updateBusinessStatus(b.id, 'inactive')} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded transition-colors hover:bg-rose-50 hover:text-rose-600">Deactivate</button>
                        )}
                        <button onClick={() => setEditBusiness(b)} className="p-2 text-slate-400 hover:text-slate-900"><Edit2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {tab === 'access' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-8">
                  <h3 className="text-lg font-bold mb-2">System Settings</h3>
                  <p className="text-xs text-slate-500 mb-8">Global rules for account access and registration.</p>

                  <div className="space-y-4">
                    {[
                      { 
                        id: 'allow_signup', 
                        label: 'Allow Sign Up', 
                        desc: 'Permit new staff to register accounts',
                        active: accessSettings.allow_signup,
                        icon: Users
                      },
                      { 
                        id: 'allow_signin', 
                        label: 'Allow Sign In', 
                        desc: 'Global switch to enable/disable all logins',
                        active: accessSettings.allow_signin,
                        icon: Shield
                      }
                    ].map(policy => (
                      <div key={policy.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded flex items-center justify-center border ${
                            policy.active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-300 border-slate-200'
                          }`}>
                            <policy.icon size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{policy.label}</h4>
                            <p className="text-[11px] text-slate-500">{policy.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAccessSettings(a => ({ ...a, [policy.id]: !a.active }))}
                          className={`w-20 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            policy.active 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {policy.active ? 'Active' : 'Locked'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8">
                    <button onClick={saveAccess} disabled={accessLoading}
                      className="w-full bg-slate-900 text-white font-bold py-3 rounded-md text-sm flex items-center justify-center gap-2">
                      {accessLoading && <Loader size={16} className="animate-spin" />} Save Settings
                    </button>
                    {accessMsg && (
                      <div className={`mt-4 text-center text-xs font-bold ${accessMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {accessMsg}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

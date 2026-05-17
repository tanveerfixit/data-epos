import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ArrowRight, CheckCircle, XCircle, Clock, Loader, History, Package } from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  in_transit: { bg: 'bg-[var(--brand-warning)]/10 border-[var(--brand-warning)]/20', text: 'text-[var(--brand-warning-hover)]', icon: Clock },
  completed: { bg: 'bg-[var(--brand-success)]/10 border-[var(--brand-success)]/20', text: 'text-[var(--brand-success)]', icon: CheckCircle },
  cancelled: { bg: 'bg-[var(--brand-danger)]/10 border-[var(--brand-danger)]/20', text: 'text-[var(--brand-danger)]', icon: XCircle },
  pending: { bg: 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20', text: 'text-[var(--brand-primary)]', icon: Clock },
};

export default function BranchTransfer() {
  const { token, currentUser } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [tab, setTab] = useState<'create' | 'list' | 'lookup'>('create');
  const [branches, setBranches] = useState<any[]>([]);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [toBranch, setToBranch] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [transfers, setTransfers] = useState<any[]>([]);
  const [imeiLookup, setImeiLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    fetch('/api/branches', { headers }).then(r => r.json()).then(setBranches);
    loadTransfers();
  }, []);

  const loadTransfers = () => {
    fetch('/api/transfers', { headers }).then(r => r.json()).then(setTransfers);
  };

  const searchDevices = async (q: string) => {
    setDeviceSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`/api/devices/search?q=${encodeURIComponent(q)}`, { headers });
    setSearchResults(await res.json());
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !toBranch) return;
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST', headers,
        body: JSON.stringify({ device_id: selectedDevice.id, to_branch_id: Number(toBranch), notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ text: '✓ Transfer initiated successfully', type: 'success' });
      setSelectedDevice(null); setDeviceSearch(''); setToBranch(''); setNotes('');
      loadTransfers();
    } catch (err: any) {
      setMsg({ text: `✗ ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const completeTransfer = async (id: number) => {
    await fetch(`/api/transfers/${id}/complete`, { method: 'PUT', headers });
    loadTransfers();
  };

  const cancelTransfer = async (id: number) => {
    if (!confirm('Cancel this transfer?')) return;
    await fetch(`/api/transfers/${id}/cancel`, { method: 'PUT', headers });
    loadTransfers();
  };

  const doLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true); setLookupResult(null);
    try {
      const res = await fetch(`/api/transfers/device/${encodeURIComponent(imeiLookup)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLookupResult(data);
    } catch (err: any) {
      setLookupResult({ error: err.message });
    } finally { user: setLookupLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)]">
      <div className="p-6 border-b border-[var(--border-base)] bg-[var(--bg-card)]">
        <h2 className="text-xl font-bold text-[var(--text-main)] font-sans">Branch Transfers</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 font-sans">Transfer serialized/IMEI devices between branches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 bg-[var(--bg-card)] border-b border-[var(--border-base)]">
        {[
          { id: 'create', label: 'New Transfer', icon: ArrowRight },
          { id: 'list', label: `All Transfers (${transfers.length})`, icon: Package },
          { id: 'lookup', label: 'IMEI History', icon: History },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); if (t.id === 'list') loadTransfers(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition duration-150 ${tab === t.id ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--bg-hover)]/30' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-6 font-sans">

        {/* NEW TRANSFER */}
        {tab === 'create' && (
          <div className="max-w-lg">
            {msg.text && (
              <div className={`mb-4 px-4 py-3 text-sm border ${msg.type === 'success' ? 'bg-[var(--brand-success)]/10 text-[var(--brand-success)] border-[var(--brand-success)]/20' : 'bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] border-[var(--brand-danger)]/20'}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="space-y-5">
              {/* Device Search */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Search Device (IMEI, Model, SKU)</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={deviceSearch}
                    onChange={e => { searchDevices(e.target.value); setSelectedDevice(null); }}
                    placeholder="Type IMEI, Model Name, or SKU..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] text-[var(--text-main)]"
                  />
                </div>
                {searchResults.length > 0 && !selectedDevice && (
                  <div className="border border-[var(--border-base)] bg-[var(--bg-card)] mt-1 overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.map(d => (
                      <button key={d.id} type="button" onClick={() => { setSelectedDevice(d); setDeviceSearch(d.imei); setSearchResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-hover)] text-sm border-b border-[var(--border-base)] last:border-0 transition flex flex-col">
                        <div className="font-semibold text-[var(--text-main)] font-mono">{d.imei}</div>
                        <div className="text-[var(--text-muted)] text-xs mt-0.5">{d.product_name} · {d.color} {d.gb} · <span className="text-[var(--brand-primary)] font-medium">{d.branch_name}</span></div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedDevice && (
                  <div className="mt-2 p-3 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-sm">
                    <div className="font-semibold text-[var(--brand-primary)]">{selectedDevice.product_name}</div>
                    <div className="text-[var(--text-main)] text-xs mt-0.5">IMEI: <span className="font-mono">{selectedDevice.imei}</span> · {selectedDevice.color} {selectedDevice.gb} · Currently at: <strong>{selectedDevice.branch_name}</strong></div>
                  </div>
                )}
              </div>

              {/* Destination Branch */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Transfer To Branch</label>
                <select value={toBranch} onChange={e => setToBranch(e.target.value)} required
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] text-[var(--text-main)]">
                  <option value="">Select destination branch...</option>
                  {branches.filter(b => b.id !== currentUser?.branch_id && (!selectedDevice || b.id !== selectedDevice.branch_id)).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Notes (optional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for transfer..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] text-[var(--text-main)]" />
              </div>

              <button type="submit" disabled={loading || !selectedDevice || !toBranch}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 text-white font-semibold px-6 py-2.5 transition flex items-center gap-2">
                {loading ? <Loader size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                Initiate Transfer
              </button>
            </form>
          </div>
        )}

        {/* TRANSFERS LIST */}
        {tab === 'list' && (
          <div className="space-y-2">
            {transfers.length === 0 && <div className="text-center text-[var(--text-muted)] py-16">No transfers yet.</div>}
            {transfers.map(t => {
              const s = statusColors[t.status] || statusColors.pending;
              const Icon = s.icon;
              return (
                <div key={t.id} className="bg-[var(--bg-card)] border border-[var(--border-base)] p-4 flex items-center gap-4">
                  <div className={`p-2 border ${s.bg}`}><Icon size={16} className={s.text} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text-main)] text-sm">{t.product_name || 'Stock Item'}</span>
                      {t.imei && <span className="text-xs bg-[var(--bg-hover)] border border-[var(--border-base)] text-[var(--text-muted)] px-2 py-0.5 font-mono">{t.imei}</span>}
                      <span className={`text-xs px-2 py-0.5 border ${s.bg} ${s.text}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      <span className="font-semibold text-[var(--text-main)]">{t.from_branch_name}</span>
                      <ArrowRight size={11} className="inline mx-1 text-[var(--text-muted)]" />
                      <span className="font-semibold text-[var(--text-main)]">{t.to_branch_name}</span>
                      {t.notes && ` · "${t.notes}"`}
                      {' · '}{new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {t.status === 'in_transit' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => completeTransfer(t.id)}
                        className="text-xs bg-[var(--brand-success)]/10 hover:bg-[var(--brand-success)]/20 text-[var(--brand-success)] border border-[var(--brand-success)]/20 px-3 py-1.5 font-bold transition">
                        ✓ Received
                      </button>
                      <button onClick={() => cancelTransfer(t.id)}
                        className="text-xs bg-[var(--brand-danger)]/10 hover:bg-[var(--brand-danger)]/20 text-[var(--brand-danger)] border border-[var(--brand-danger)]/20 px-3 py-1.5 font-bold transition">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* IMEI LOOKUP */}
        {tab === 'lookup' && (
          <div className="max-w-lg">
            <form onSubmit={doLookup} className="flex gap-3 mb-6">
              <input value={imeiLookup} onChange={e => setImeiLookup(e.target.value)} placeholder="Enter IMEI to see full history..." required
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] text-[var(--text-main)]" />
              <button type="submit" disabled={lookupLoading}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-5 py-2.5 transition flex items-center gap-2 text-sm font-semibold disabled:opacity-60">
                {lookupLoading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />} Search
              </button>
            </form>

            {lookupResult?.error && (
              <div className="text-[var(--brand-danger)] text-sm bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/20 p-3">
                {lookupResult.error}
              </div>
            )}

            {lookupResult?.device && (
              <div>
                <div className="bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 p-4 mb-4 text-[var(--text-main)]">
                  <div className="font-bold text-[var(--brand-primary)]">{lookupResult.device.imei}</div>
                  <div className="text-sm mt-1">Currently at: <strong>{lookupResult.currentBranch?.name}</strong> · Status: {lookupResult.device.status}</div>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 uppercase tracking-wide">Transfer History ({lookupResult.transfers.length})</h3>
                {lookupResult.transfers.length === 0 && <div className="text-[var(--text-muted)] text-sm">No transfers recorded for this device.</div>}
                <div className="space-y-2">
                  {lookupResult.transfers.map((t: any) => {
                    const s = statusColors[t.status] || statusColors.pending;
                    const Icon = s.icon;
                    return (
                      <div key={t.id} className="bg-[var(--bg-card)] border border-[var(--border-base)] p-3 flex items-center gap-3">
                        <Icon size={15} className={s.text} />
                        <div className="flex-1 text-sm">
                          <span className="font-semibold text-[var(--text-main)]">{t.from_branch_name}</span>
                          <ArrowRight size={11} className="inline mx-1 text-[var(--text-muted)]" />
                          <span className="font-semibold text-[var(--text-main)]">{t.to_branch_name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 border ${s.bg} ${s.text}`}>{t.status}</span>
                          <div className="text-xs text-[var(--text-muted)] mt-1">{new Date(t.created_at).toLocaleString()} · by {t.initiated_by_name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

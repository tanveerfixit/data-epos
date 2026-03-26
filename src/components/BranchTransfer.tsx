import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ArrowRight, CheckCircle, XCircle, Clock, Loader, History, Package } from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  in_transit: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-300', icon: Clock },
  completed: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-300', icon: CheckCircle },
  cancelled: { bg: 'bg-slate-500/20 border-slate-500/30', text: 'text-slate-400', icon: XCircle },
  pending: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-300', icon: Clock },
};

export default function BranchTransfer() {
  const { token } = useAuth();
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
    const res = await fetch(`/api/devices/search?imei=${encodeURIComponent(q)}`, { headers });
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
    } finally { setLookupLoading(false); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-[#2c3e50]">Branch Transfers</h2>
        <p className="text-sm text-slate-500 mt-0.5">Transfer serialized/IMEI devices between branches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 bg-white border-b border-slate-200">
        {[
          { id: 'create', label: 'New Transfer', icon: ArrowRight },
          { id: 'list', label: `All Transfers (${transfers.length})`, icon: Package },
          { id: 'lookup', label: 'IMEI History', icon: History },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); if (t.id === 'list') loadTransfers(); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${tab === t.id ? 'border-[#3498db] text-[#3498db]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {/* NEW TRANSFER */}
        {tab === 'create' && (
          <div className="max-w-lg">
            {msg.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="space-y-5">
              {/* Device Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Device by IMEI</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={deviceSearch}
                    onChange={e => { searchDevices(e.target.value); setSelectedDevice(null); }}
                    placeholder="Type IMEI to search..."
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]"
                  />
                </div>
                {searchResults.length > 0 && !selectedDevice && (
                  <div className="border border-slate-200 rounded-lg mt-1 overflow-hidden shadow-sm">
                    {searchResults.map(d => (
                      <button key={d.id} type="button" onClick={() => { setSelectedDevice(d); setDeviceSearch(d.imei); setSearchResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#3498db]/5 text-sm border-b border-slate-100 last:border-0 transition">
                        <div className="font-medium text-slate-800">{d.imei}</div>
                        <div className="text-slate-500 text-xs">{d.product_name} · {d.color} {d.gb} · <span className="text-slate-600 font-medium">{d.branch_name}</span></div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedDevice && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div className="font-semibold text-blue-800">{selectedDevice.product_name}</div>
                    <div className="text-blue-600 text-xs mt-0.5">IMEI: {selectedDevice.imei} · {selectedDevice.color} {selectedDevice.gb} · Currently at: <strong>{selectedDevice.branch_name}</strong></div>
                  </div>
                )}
              </div>

              {/* Destination Branch */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Transfer To Branch</label>
                <select value={toBranch} onChange={e => setToBranch(e.target.value)} required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]">
                  <option value="">Select destination branch...</option>
                  {branches.filter(b => !selectedDevice || b.id !== selectedDevice.branch_id).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for transfer..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]" />
              </div>

              <button type="submit" disabled={loading || !selectedDevice || !toBranch}
                className="bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2">
                {loading ? <Loader size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                Initiate Transfer
              </button>
            </form>
          </div>
        )}

        {/* TRANSFERS LIST */}
        {tab === 'list' && (
          <div className="space-y-2">
            {transfers.length === 0 && <div className="text-center text-slate-400 py-16">No transfers yet.</div>}
            {transfers.map(t => {
              const s = statusColors[t.status] || statusColors.pending;
              const Icon = s.icon;
              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className={`p-2 rounded-lg border ${s.bg}`}><Icon size={16} className={s.text} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-sm">{t.product_name || 'Stock Item'}</span>
                      {t.imei && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{t.imei}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.text}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{t.from_branch_name}</span>
                      <ArrowRight size={11} className="inline mx-1" />
                      <span className="font-medium text-slate-700">{t.to_branch_name}</span>
                      {t.notes && ` · "${t.notes}"`}
                      {' · '}{new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {t.status === 'in_transit' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => completeTransfer(t.id)}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition font-medium">
                        ✓ Received
                      </button>
                      <button onClick={() => cancelTransfer(t.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition">
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
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 focus:border-[#3498db]" />
              <button type="submit" disabled={lookupLoading}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white px-5 py-2.5 rounded-lg transition flex items-center gap-2 text-sm font-medium disabled:opacity-60">
                {lookupLoading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />} Search
              </button>
            </form>

            {lookupResult?.error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{lookupResult.error}</div>}

            {lookupResult?.device && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="font-semibold text-blue-900">{lookupResult.device.imei}</div>
                  <div className="text-sm text-blue-700 mt-1">Currently at: <strong>{lookupResult.currentBranch?.name}</strong> · Status: {lookupResult.device.status}</div>
                </div>

                <h3 className="text-sm font-semibold text-slate-700 mb-2">Transfer History ({lookupResult.transfers.length})</h3>
                {lookupResult.transfers.length === 0 && <div className="text-slate-400 text-sm">No transfers recorded for this device.</div>}
                <div className="space-y-2">
                  {lookupResult.transfers.map((t: any) => {
                    const s = statusColors[t.status] || statusColors.pending;
                    const Icon = s.icon;
                    return (
                      <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                        <Icon size={15} className={s.text} />
                        <div className="flex-1 text-sm">
                          <span className="font-medium text-slate-800">{t.from_branch_name}</span>
                          <ArrowRight size={11} className="inline mx-1 text-slate-400" />
                          <span className="font-medium text-slate-800">{t.to_branch_name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.text}`}>{t.status}</span>
                          <div className="text-xs text-slate-400 mt-0.5">{new Date(t.created_at).toLocaleString()} · by {t.initiated_by_name}</div>
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

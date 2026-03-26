import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, CheckCircle, AlertCircle, Phone, User } from 'lucide-react';
import { Repair, Customer } from '../types';

interface RepairListProps {
  preSelectedCustomerId?: number | null;
}

export default function RepairList({ preSelectedCustomerId }: RepairListProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRepair, setNewRepair] = useState<Partial<Repair>>({
    customer_id: preSelectedCustomerId || null,
    device_model: '',
    issue: '',
    status: 'new'
  });

  useEffect(() => {
    fetch('/api/repairs').then(res => res.json()).then(setRepairs);
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
    
    if (preSelectedCustomerId) {
      setIsModalOpen(true);
      setNewRepair(prev => ({ ...prev, customer_id: preSelectedCustomerId }));
    }
  }, [preSelectedCustomerId]);

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRepair)
    });
    if (response.ok) {
      const data = await response.json();
      setRepairs([{ ...newRepair, id: data.id, status: 'new', created_at: new Date().toISOString() } as Repair, ...repairs]);
      setIsModalOpen(false);
      setNewRepair({ customer_id: null, device_model: '', issue: '', status: 'new' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'diagnosed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'repairing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'collected': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 space-y-4 bg-[#f4f7f9] h-full overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-slate-700">Repairs</h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search repairs..."
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            New Repair Job
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="px-4 py-2 border-r border-slate-200">Job ID</th>
              <th className="px-4 py-2 border-r border-slate-200">Device Model</th>
              <th className="px-4 py-2 border-r border-slate-200">Customer</th>
              <th className="px-4 py-2 border-r border-slate-200">Issue</th>
              <th className="px-4 py-2 border-r border-slate-200">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map(repair => (
              <tr key={repair.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                <td className="px-4 py-2 border-r border-slate-200 font-mono">#{repair.id}</td>
                <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800">{repair.device_model}</td>
                <td className="px-4 py-2 border-r border-slate-200">{repair.customer_name || 'Unknown'}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-500">{repair.issue}</td>
                <td className="px-4 py-2 border-r border-slate-200">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusColor(repair.status)}`}>
                    {repair.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <button className="text-[#3498db] hover:underline font-medium">
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">New Repair Job</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddRepair} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Customer</label>
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={newRepair.customer_id || ''}
                  onChange={e => setNewRepair({ ...newRepair, customer_id: Number(e.target.value) })}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Device Model</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. iPhone 13 Pro"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newRepair.device_model}
                    onChange={e => setNewRepair({ ...newRepair, device_model: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Issue Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={newRepair.issue}
                  onChange={e => setNewRepair({ ...newRepair, issue: e.target.value })}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all mt-4"
              >
                Create Repair Job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

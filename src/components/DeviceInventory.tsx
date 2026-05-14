import { useState, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';

interface Device {
  id: number;
  sku_id: number;
  product_name: string;
  color?: string;
  gb?: string;
  condition?: string;
  imei: string;
  po_number?: string;
  created_at: string;
  invoice_number?: string;
  status: string;
}

interface Props {
  onSelectPO: (poNumber: string) => void;
  onSelectProduct: (skuId: number) => void;
  onSelectDevice: (id: number) => void;
}

export default function DeviceInventory({ onSelectPO, onSelectProduct, onSelectDevice }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [statusFilter, setStatusFilter] = useState('in_stock');

  useEffect(() => {
    fetch(`/api/devices?status=${statusFilter}`).then(res => res.json()).then(setDevices);
  }, [statusFilter]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      {/* Header */}
      <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-base)]">
        <h2 className="text-xl font-medium text-[var(--text-main)] mb-4">Devices Inventory</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48"
          >
            <option value="in_stock">Devices in Inventory</option>
            <option value="sold">Sold Devices</option>
            <option value="repair">In Repair</option>
          </select>
          <select className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48">
            <option>All Device Models</option>
          </select>
          <select className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-40">
            <option>All Colors</option>
          </select>
          <select className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-40">
            <option>All Cond</option>
          </select>
          
          <div className="relative flex-1 max-w-md ml-auto flex">
            <input
              type="text"
              placeholder="Search IMEI"
              className="w-full pl-3 pr-10 py-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-[var(--text-main)]"
            />
            <button className="px-3 bg-[var(--bg-hover)] border border-l-0 border-[var(--border-base)] rounded-r hover:opacity-80">
              <Search size={16} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-accent-subtle)] border-b border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/4">Model</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-center w-24">Color</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-center w-20">GB</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-center w-20">Cond</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/6">IMEI Number</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-center w-24">PO #</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/6">Date Entered</th>
                <th className="px-4 py-2 text-center w-1/6">Invoice #</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => (
                <tr key={device.id} className={`border-b border-[var(--border-base)] text-sm hover:bg-[var(--bg-hover)] transition-colors ${idx % 2 === 1 ? 'bg-[var(--bg-zebra)]' : ''}`}>
                  <td className="px-4 py-2 border-r border-[var(--border-base)]">
                    <button 
                      onClick={() => onSelectDevice(device.id)}
                      className="text-[var(--brand-primary)] hover:underline text-left font-medium"
                    >
                      {device.product_name}
                    </button>
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--border-base)] text-center text-[var(--text-muted)]">{device.color || ''}</td>
                  <td className="px-4 py-2 border-r border-[var(--border-base)] text-center text-[var(--text-muted)]">{device.gb || ''}</td>
                  <td className="px-4 py-2 border-r border-[var(--border-base)] text-center text-[var(--text-muted)]">{device.condition || ''}</td>
                  <td className="px-4 py-2 border-r border-[var(--border-base)]">
                    <button 
                      onClick={() => onSelectDevice(device.id)}
                      className="text-[var(--brand-primary)] hover:underline font-mono text-xs"
                    >
                      {device.imei}
                    </button>
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--border-base)] text-center">
                    {device.po_number && (
                      <button 
                        onClick={() => onSelectPO(device.po_number!)}
                        className="text-[var(--brand-primary)] hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <span>{device.po_number}</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted-more)]">
                    {device.created_at}
                  </td>
                  <td className="px-4 py-2 text-center text-[var(--text-muted)]">
                    {device.invoice_number || 'In Inventory'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-base)] flex justify-between items-center text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <select className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-2 py-1 focus:outline-none text-[var(--text-main)]">
            <option>auto</option>
          </select>
          <span className="font-bold">1-21/146</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)]">«</button>
          <button className="px-3 py-1 bg-[var(--brand-primary)] text-white rounded font-bold">1</button>
          <button className="px-3 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)]">2</button>
          <span className="px-2 text-[var(--text-muted-more)]">..</span>
          <button className="px-3 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)]">6</button>
          <button className="px-3 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)]">7</button>
          <button className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)]">»</button>
        </div>
      </div>
    </div>
  );
}

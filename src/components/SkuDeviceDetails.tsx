import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter } from 'lucide-react';

interface DeviceDetail {
  id: number;
  imei: string;
  color?: string;
  gb?: string;
  condition?: string;
  status: string;
  created_at: string;
  invoice_number?: string;
}

interface Props {
  skuId: number;
  onBack: () => void;
}

export default function SkuDeviceDetails({ skuId, onBack }: Props) {
  const [devices, setDevices] = useState<DeviceDetail[]>([]);
  const [productName, setProductName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch SKU info to get product name
    fetch(`/api/products/${skuId}`)
      .then(res => res.json())
      .then(data => {
        setProductName(data.product_name || data.name);
      });

    // Fetch all devices for this SKU
    fetch(`/api/products/${skuId}/devices`)
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        setLoading(false);
      });
  }, [skuId]);

  const filteredDevices = devices.filter(d => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesSearch = d.imei.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-medium text-slate-700">{productName}</h2>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Device History & Inventory</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48"
          >
            <option value="all">All Devices</option>
            <option value="in_stock">Available (In Stock)</option>
            <option value="sold">Sold</option>
            <option value="repair">In Repair</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-md ml-auto flex">
          <input
            type="text"
            placeholder="Search IMEI in this list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
          />
          <button className="px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r hover:bg-slate-200">
            <Search size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3498db]"></div>
          </div>
        ) : (
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e9ecef] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="px-4 py-3 border-r border-slate-300">IMEI Number</th>
                  <th className="px-4 py-3 border-r border-slate-300 text-center">Color</th>
                  <th className="px-4 py-3 border-r border-slate-300 text-center">GB</th>
                  <th className="px-4 py-3 border-r border-slate-300 text-center">Condition</th>
                  <th className="px-4 py-3 border-r border-slate-300 text-center">Status</th>
                  <th className="px-4 py-3 border-r border-slate-300">Date Added</th>
                  <th className="px-4 py-3 text-center">Invoice #</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                      No devices found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device, idx) => (
                    <tr key={device.id} className={`border-b border-slate-200 text-sm hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-[#f8f9fa]' : ''}`}>
                      <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-700 font-bold">{device.imei}</td>
                      <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-600">{device.color || '-'}</td>
                      <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-600">{device.gb || '-'}</td>
                      <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-600">{device.condition || '-'}</td>
                      <td className="px-4 py-3 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          device.status === 'in_stock' ? 'bg-green-100 text-green-700' :
                          device.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {device.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-slate-500">
                        {new Date(device.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-bold">
                        {device.invoice_number || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

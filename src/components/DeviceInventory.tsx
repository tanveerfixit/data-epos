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
  
  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetch(`/api/devices?status=${statusFilter}`)
      .then(res => res.json())
      .then(data => setDevices(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching devices:', err);
        setDevices([]);
      });
  }, [statusFilter]);

  // Derived unique lists for dropdown filtering options
  const uniqueModels = Array.from(new Set(devices.map(d => d.product_name).filter(Boolean))).sort();
  const uniqueColors = Array.from(new Set(devices.map(d => d.color).filter(Boolean))).sort();
  const uniqueConditions = Array.from(new Set(devices.map(d => d.condition).filter(Boolean))).sort();

  // Reset filters and page number when status changes
  useEffect(() => {
    setSelectedModel('all');
    setSelectedColor('all');
    setSelectedCondition('all');
    setSearchQuery('');
    setCurrentPage(1);
  }, [statusFilter]);

  // Reset page to 1 when filters or query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModel, selectedColor, selectedCondition]);

  // Perform filtering
  const filteredDevices = devices.filter(d => {
    if (selectedModel !== 'all' && d.product_name !== selectedModel) return false;
    if (selectedColor !== 'all' && d.color !== selectedColor) return false;
    if (selectedCondition !== 'all' && d.condition !== selectedCondition) return false;
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchImei = d.imei && d.imei.toLowerCase().includes(q);
      const matchName = d.product_name && d.product_name.toLowerCase().includes(q);
      const matchPo = d.po_number && d.po_number.toLowerCase().includes(q);
      const matchInv = d.invoice_number && d.invoice_number.toLowerCase().includes(q);
      if (!matchImei && !matchName && !matchPo && !matchInv) return false;
    }
    
    return true;
  });

  // Calculate Pagination Values
  const totalFiltered = filteredDevices.length;
  const pageSizes = [10, 25, 50, 100];
  const startIdx = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalFiltered);
  
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
          
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48"
          >
            <option value="all">All Device Models</option>
            {uniqueModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          
          <select 
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-40"
          >
            <option value="all">All Colors</option>
            {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select 
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-40"
          >
            <option value="all">All Cond</option>
            {uniqueConditions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <div className="relative flex-1 max-w-md ml-auto flex">
            <input
              type="text"
              placeholder="Search IMEI, Model, PO#, Inv#"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-[var(--text-main)]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title="Clear Search"
              >
                Clear
              </button>
            )}
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
              {paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[var(--text-muted)] text-sm">
                    No matching devices found in inventory.
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device, idx) => (
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
                      {new Date(device.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center text-[var(--text-muted)]">
                      {device.invoice_number || 'In Inventory'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-base)] flex justify-between items-center text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span className="font-medium text-[var(--text-muted)]">Items per page:</span>
          <select 
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded px-2 py-1 focus:outline-none text-[var(--text-main)]"
          >
            {pageSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="font-bold text-[var(--text-main)]">{startIdx}-{endIdx}/{totalFiltered}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)] disabled:opacity-40 disabled:hover:bg-transparent"
          >
            «
          </button>
          
          {getPageNumbers().map((p, i) => {
            if (p === '...') {
              return <span key={`dots-${i}`} className="px-2 text-[var(--text-muted-more)]">..</span>;
            }
            return (
              <button 
                key={`page-${p}`}
                onClick={() => setCurrentPage(p as number)}
                className={`px-3 py-1 border rounded transition-colors ${currentPage === p ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] font-bold' : 'border-[var(--border-base)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'}`}
              >
                {p}
              </button>
            );
          })}
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-main)] disabled:opacity-40 disabled:hover:bg-transparent"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

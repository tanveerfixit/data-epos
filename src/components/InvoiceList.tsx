import { useState, useEffect } from 'react';
import { Search, List, X } from 'lucide-react';
import { Invoice } from '../types';

interface Props {
  onSelectInvoice: (id: number) => void;
  onSelectCustomer?: (id: number) => void;
}

export default function InvoiceList({ onSelectInvoice, onSelectCustomer }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetch('/api/invoices').then(res => res.json()).then(setInvoices);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-slate-200">
        <h2 className="text-xl font-medium text-slate-700">Sales Invoices</h2>
        <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm">
          <List size={16} />
          Cash Register
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 flex flex-wrap gap-2 items-center bg-white border-b border-slate-200">
        <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
          <option>Date, Invoice No.</option>
        </select>
        <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
          <option>All Types</option>
        </select>
        <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
          <option>Phone Lab</option>
        </select>
        
        <div className="relative flex-1 max-w-md ml-auto flex">
          <input
            type="text"
            placeholder="Search Customer or Invoice"
            className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
          />
          <button className="px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r hover:bg-slate-200">
            <Search size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-slate-300 rounded shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-300 w-24">Date</th>
                <th className="px-4 py-2 border-r border-slate-300 w-24">Time</th>
                <th className="px-4 py-2 border-r border-slate-300 w-32">Invoice#</th>
                <th className="px-4 py-2 border-r border-slate-300">Customer Name</th>
                <th className="px-4 py-2 border-r border-slate-300 w-40">Sales Person</th>
                <th className="px-4 py-2 border-r border-slate-300 text-right w-28">Taxable</th>
                <th className="px-4 py-2 border-r border-slate-300 text-right w-28">Taxes</th>
                <th className="px-4 py-2 border-r border-slate-300 text-right w-28">Non Taxable</th>
                <th className="px-4 py-2 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, idx) => (
                <tr 
                  key={invoice.id} 
                  className={`border-b border-slate-200 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-[#f8f9fa]' : ''}`}
                  onClick={() => onSelectInvoice(invoice.id)}
                >
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{formatDate(invoice.created_at)}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{formatTime(invoice.created_at)}</td>
                  <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-500">{invoice.invoice_number}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-600">
                    {invoice.customer_id ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer?.(invoice.customer_id!);
                        }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {invoice.customer_name}
                      </button>
                    ) : (
                      'Unassigned'
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-600">Phone Lab</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-600">€{invoice.subtotal.toFixed(2)}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-600">€{invoice.tax_total.toFixed(2)}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-600">€0.00</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">€{invoice.grand_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <select className="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none">
            <option>auto</option>
          </select>
          <span className="font-bold">1-21/8724</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">«</button>
          <button className="px-3 py-1 bg-[#3498db] text-white rounded font-bold">1</button>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">2</button>
          <span className="px-2">..</span>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">415</button>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">416</button>
          <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">»</button>
        </div>
      </div>
    </div>
  );
}

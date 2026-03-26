import React, { useState, useEffect } from 'react';
import { Printer, List, ChevronDown, ExternalLink, Users, Smartphone } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface POItem {
  id: number;
  description: string;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
  total: number;
}

interface PODetail extends PurchaseOrder {
  supplier_email?: string;
  items: POItem[];
}

interface Props {
  poId: number;
  onBack: () => void;
}

export default function PurchaseOrderDetail({ poId, onBack }: Props) {
  const [po, setPo] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/purchase-orders/${poId}`)
      .then(res => res.json())
      .then(data => {
        setPo(data);
        setLoading(false);
      });
  }, [poId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Purchase Order Details...</div>;
  if (!po) return <div className="p-8 text-center text-red-500">Purchase Order not found.</div>;

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-1">
          <button 
            onClick={onBack}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Purchase Order {po.po_number}
          </button>
          <button className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-sm font-medium hover:bg-slate-200 transition-colors">
            Activity Log
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex">
            <button className="bg-[#00e5ff] hover:bg-[#00d4eb] text-slate-900 px-3 py-1.5 rounded-l text-sm font-bold flex items-center gap-2 transition-colors">
              <Printer size={16} />
              Print
            </button>
            <button className="bg-[#00e5ff] hover:bg-[#00d4eb] text-slate-900 px-1.5 py-1.5 rounded-r border-l border-black/10 transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
          <button 
            onClick={onBack}
            className="bg-white border border-slate-300 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <List size={16} />
            List Purchase
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-auto">
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className="bg-[#00c853] text-white px-6 py-1 rounded text-sm font-bold uppercase shadow-sm">
            {po.status}
          </span>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Info */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#e9ecef] px-4 py-2 border-b border-slate-300 flex items-center gap-2">
              <span className="text-slate-700 font-bold flex items-center gap-2">
                <Users size={16} />
                Supplier Info
              </span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-24 font-bold text-slate-700">Company :</span>
                <span className="text-[#3498db] hover:underline cursor-pointer flex items-center gap-1">
                  {po.supplier_name}
                  <ExternalLink size={12} />
                </span>
              </div>
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-24 font-bold text-slate-700">Supplier :</span>
                <span className="text-slate-600">Faisal</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-slate-700">Email :</span>
                <span className="text-slate-600">{po.supplier_email || ''}</span>
              </div>
            </div>
          </div>

          {/* Purchase Order Info */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#e9ecef] px-4 py-2 border-b border-slate-300 flex items-center gap-2">
              <span className="text-slate-700 font-bold flex items-center gap-2">
                <Smartphone size={16} />
                Purchase Order Info
              </span>
            </div>
            <div className="p-0">
              <div className="bg-white border-b border-slate-200">
                <button className="px-4 py-2 text-sm font-medium border-b-2 border-[#3498db] text-[#3498db]">Basic Info</button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex border-b border-slate-100 pb-2">
                  <span className="w-32 font-bold text-slate-700">Date Expected :</span>
                  <span className="text-slate-600">{po.expected_at ? new Date(po.expected_at).toLocaleDateString('en-GB') : ''}</span>
                </div>
                <div className="flex border-b border-slate-100 pb-2">
                  <span className="w-32 font-bold text-slate-700">Shipping Cost :</span>
                  <span className="text-slate-600">€{po.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-slate-700">Lot Ref. No. :</span>
                  <span className="text-slate-600">{po.lot_ref_no || ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-300 w-12 text-center">#</th>
                <th className="px-4 py-2 border-r border-slate-300">Description</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center">Need/Have/OnPO</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center">Ordered Qty</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center">Received Qty</th>
                <th className="px-4 py-2 border-r border-slate-300 text-right">Unit Cost</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {po.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-medium">{item.description}</span>
                      <span className="text-[#3498db] text-xs hover:underline cursor-pointer flex items-center gap-1">
                        (1506012 <ExternalLink size={10} />)
                      </span>
                      <span className="text-[#3498db] text-xs hover:underline cursor-pointer flex items-center gap-1 mt-1">
                        <ExternalLink size={10} /> SHFLK46D6TD
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 text-center">
                    <span className="text-[#3498db] hover:underline cursor-pointer flex items-center justify-center gap-1">
                      0 / 1 / 0
                      <ExternalLink size={12} />
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-600">{item.ordered_qty}</td>
                  <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-600">{item.received_qty}</td>
                  <td className="px-4 py-3 border-r border-slate-200 text-right text-slate-600">€{item.unit_cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-800 font-medium">€{item.total.toFixed(2)}</td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="px-4 py-2 border-r border-slate-200"></td>
                <td className="px-4 py-2 border-r border-slate-200 text-center">{po.items.reduce((sum, item) => sum + item.ordered_qty, 0)}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-center">{po.items.reduce((sum, item) => sum + item.received_qty, 0)}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-700">Total :</td>
                <td className="px-4 py-2 text-right text-slate-900">€{po.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button className="bg-[#ffff00] hover:bg-[#e6e600] text-slate-900 px-6 py-1.5 rounded text-sm font-bold shadow-sm transition-colors">
            Re-Open PO
          </button>
        </div>
      </div>
    </div>
  );
}
